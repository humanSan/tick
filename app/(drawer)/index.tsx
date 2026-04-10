import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ImageIcon, Menu, Pause, Play, Square, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Spacing } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 0.7;

type TimerState = 'idle' | 'running' | 'paused';

export default function StopwatchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [bgImage, setBgImage] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Load background image on mount
  useEffect(() => {
    AsyncStorage.getItem('@tick/bg_image').then(v => {
      if (v) setBgImage(v);
    });
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setBgImage(uri);
      AsyncStorage.setItem('@tick/bg_image', uri);
    }
  };

  // Animated ring
  const ringPulse = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  const startPulse = useCallback(() => {
    ringOpacity.value = withTiming(1, { duration: 300 });
    ringPulse.value = 0;
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const stopPulse = useCallback(() => {
    cancelAnimation(ringPulse);
    ringOpacity.value = withTiming(0, { duration: 300 });
  }, []);

  const startTimer = useCallback(() => {
    const now = Date.now();
    if (timerState === 'idle') {
      sessionStartRef.current = now;
      startTimeRef.current = now;
      pausedElapsedRef.current = 0;
    } else if (timerState === 'paused') {
      startTimeRef.current = now;
    }
    setTimerState('running');
    startPulse();
  }, [timerState, startPulse]);

  const pauseTimer = useCallback(() => {
    setTimerState('paused');
    pausedElapsedRef.current = elapsed;
    stopPulse();
  }, [elapsed, stopPulse]);

  const completeTimer = useCallback(() => {
    const endTime = Date.now();
    const startTime = sessionStartRef.current;
    const duration = elapsed;

    setTimerState('idle');
    setElapsed(0);
    pausedElapsedRef.current = 0;
    stopPulse();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    router.push({
      pathname: '/session-edit',
      params: {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        duration: duration.toString(),
        isNew: 'true',
      },
    });
  }, [elapsed, router, stopPulse]);

  const resetTimer = useCallback(() => {
    setTimerState('idle');
    setElapsed(0);
    pausedElapsedRef.current = 0;
    stopPulse();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [stopPulse]);

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsed(pausedElapsedRef.current + (Date.now() - startTimeRef.current));
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  // Opacity for everything except time when running
  const uiOpacity = useSharedValue(1);
  useEffect(() => {
    uiOpacity.value = withTiming(timerState === 'running' ? 1 : 1, { duration: 500 });
  }, [timerState]);

  const uiStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value * interpolate(ringPulse.value, [0, 1], [0.15, 0.4]) * uiOpacity.value,
    transform: [{ scale: interpolate(ringPulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  // Format time
  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timeMain = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const ringColor = 'rgba(255, 255, 255, 0.4)';
  const textColor = Colors.white;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FF4E50', '#F9D423']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {bgImage && (
        <Image
          source={{ uri: bgImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
      {bgImage && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, uiStyle]}>
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={32} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.hamburger} onPress={pickImage}>
          <ImageIcon size={28} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Timer area */}
      <View style={styles.timerArea}>
        <Animated.View style={[styles.ring, ringStyle, { borderColor: ringColor }]} />

        <View style={styles.timerTextWrap}>
          <Text style={[styles.timerMain, { color: textColor }]} adjustsFontSizeToFit numberOfLines={1}>
            {timeMain}
          </Text>
        </View>

        {/* Controls moved inside timerArea to be closer to time */}
        <Animated.View style={[styles.inlineControls, uiStyle]}>
          {timerState === 'idle' && (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={startTimer}
              activeOpacity={0.8}
            >
              <Play size={24} color={Colors.white} fill={Colors.white} />
              <Text style={styles.mainBtnText}>Start</Text>
            </TouchableOpacity>
          )}

          {timerState === 'running' && (
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[styles.glassBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={pauseTimer}
                activeOpacity={0.8}
              >
                <Pause size={22} color={Colors.white} fill={Colors.white} />
                <Text style={styles.btnText}>Pause</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={completeTimer}
                activeOpacity={0.8}
              >
                <Square size={20} color={Colors.white} fill={Colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={resetTimer}
                activeOpacity={0.8}
              >
                <RotateCcw size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {timerState === 'paused' && (
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[styles.glassBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                onPress={startTimer}
                activeOpacity={0.8}
              >
                <Play size={22} color={Colors.white} fill={Colors.white} />
                <Text style={styles.btnText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={completeTimer}
                activeOpacity={0.8}
              >
                <Square size={20} color={Colors.white} fill={Colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={resetTimer}
                activeOpacity={0.8}
              >
                <RotateCcw size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  hamburger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
  },
  timerTextWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: '100%',
    justifyContent: 'center',
  },
  timerMain: {
    fontSize: 130,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textAlign: 'center',
  },
  inlineControls: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 2,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    minWidth: 140,
  },
  mainBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_700Bold',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  glassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md - 4,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    minWidth: 120,
  },
  btnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_600SemiBold',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
