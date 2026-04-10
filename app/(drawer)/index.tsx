import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ImageIcon, Menu, Pause, Play, RotateCcw, Square, Sun } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Spacing } from '../../src/theme';

type TimerState = 'idle' | 'running' | 'paused';

const CustomSlider = ({ value, onValueChange }: { value: number, onValueChange: (v: number) => void }) => {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(width);
  widthRef.current = width;

  const scale = useSharedValue(1);
  const isHovered = useRef(false);

  const fastSpring = {
    stiffness: 300,
    damping: 20,
    mass: 0.5,
  };

  const handleDrag = useCallback((e: any) => {
    if (widthRef.current > 0) {
      let x = e.nativeEvent.locationX;
      onValueChange(Math.max(0, Math.min(x / widthRef.current, 1)));
    }
  }, [onValueChange]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={{ height: 40, justifyContent: 'center', width: 220 }}>
      <Animated.View
        style={[{ height: 32, width: '100%', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }, animatedStyle]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          scale.value = withSpring(0.98, fastSpring);
          handleDrag(e);
        }}
        onResponderMove={handleDrag}
        onResponderRelease={() => {
          scale.value = withSpring(isHovered.current ? 1.02 : 1, fastSpring);
        }}
        onResponderTerminate={() => {
          scale.value = withSpring(isHovered.current ? 1.02 : 1, fastSpring);
        }}
        //@ts-ignore
        onPointerEnter={() => {
          isHovered.current = true;
          scale.value = withSpring(1.02, fastSpring);
        }}
        //@ts-ignore
        onPointerLeave={() => {
          isHovered.current = false;
          scale.value = withSpring(1, fastSpring);
        }}
      >
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value * 100}%`, backgroundColor: Colors.white }} />
      </Animated.View>
    </View>
  );
};

export default function StopwatchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgDimness, setBgDimness] = useState<number>(0.3);
  const [bgBlur, setBgBlur] = useState<number>(0);
  const [showDimSlider, setShowDimSlider] = useState(false);

  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Load background image on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      const v = localStorage.getItem('@tick/bg_image');
      if (v) setBgImage(v);
      const d = localStorage.getItem('@tick/bg_dimness');
      if (d) setBgDimness(parseFloat(d));
      const b = localStorage.getItem('@tick/bg_blur');
      if (b) setBgBlur(parseFloat(b));
    } else {
      AsyncStorage.getItem('@tick/bg_image').then(v => {
        if (v) setBgImage(v);
      });
      AsyncStorage.getItem('@tick/bg_dimness').then(d => {
        if (d) setBgDimness(parseFloat(d));
      });
      AsyncStorage.getItem('@tick/bg_blur').then(b => {
        if (b) setBgBlur(parseFloat(b));
      });
    }
  }, []);

  const handleDimnessChange = useCallback((val: number) => {
    setBgDimness(val);
    const vStr = val.toString();
    if (Platform.OS === 'web') {
      localStorage.setItem('@tick/bg_dimness', vStr);
    } else {
      AsyncStorage.setItem('@tick/bg_dimness', vStr);
    }
  }, []);

  const handleBlurChange = useCallback((val: number) => {
    setBgBlur(val);
    const vStr = val.toString();
    if (Platform.OS === 'web') {
      localStorage.setItem('@tick/bg_blur', vStr);
    } else {
      AsyncStorage.setItem('@tick/bg_blur', vStr);
    }
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setBgImage(uri);

      if (Platform.OS === 'web') {
        localStorage.setItem('@tick/bg_image', uri);
      } else {
        AsyncStorage.setItem('@tick/bg_image', uri);
      }
    }
  };

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
  }, [timerState]);

  const pauseTimer = useCallback(() => {
    setTimerState('paused');
    pausedElapsedRef.current = elapsed;
  }, [elapsed]);

  const completeTimer = useCallback(() => {
    const endTime = Date.now();
    const startTime = sessionStartRef.current;
    const duration = elapsed;

    setTimerState('idle');
    setElapsed(0);
    pausedElapsedRef.current = 0;

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
  }, [elapsed, router]);

  const resetTimer = useCallback(() => {
    setTimerState('idle');
    setElapsed(0);
    pausedElapsedRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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

  // Format time
  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timeMain = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const textColor = Colors.white;

  return (
    <View style={[styles.container, { paddingTop: insets.top, overflow: 'hidden' }]}>
      <LinearGradient
        colors={['#FF4E50', '#F9D423']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {bgImage && (
        <Image
          source={{ uri: bgImage }}
          style={[StyleSheet.absoluteFill, { transform: [{ scale: 1 + (bgBlur * 0.2) }] }]}
          contentFit="cover"
          blurRadius={bgBlur * 50}
        />
      )}
      {bgImage && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${bgDimness})` }]} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, uiStyle, { zIndex: 10 }]}>
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={32} color={Colors.white} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {bgImage && (
            <TouchableOpacity style={styles.hamburger} onPress={() => setShowDimSlider(!showDimSlider)}>
              <Sun size={26} color={Colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.hamburger} onPress={pickImage}>
            <ImageIcon size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Dropdown for Settings */}
      {showDimSlider && bgImage && (
        <Animated.View style={[styles.dropdownPanel, { top: insets.top + 60 }, uiStyle]}>
          <Text style={{ color: Colors.white, marginBottom: Spacing.sm, fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm }}>Background Dimness</Text>
          <CustomSlider value={bgDimness} onValueChange={handleDimnessChange} />
          <View style={{ height: Spacing.lg }} />
          <Text style={{ color: Colors.white, marginBottom: Spacing.sm, fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm }}>Background Blur</Text>
          <CustomSlider value={bgBlur} onValueChange={handleBlurChange} />
        </Animated.View>
      )}

      {/* Timer area */}
      <View style={styles.timerArea}>
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
  dropdownPanel: {
    position: 'absolute',
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    padding: Spacing.xl,
    borderRadius: 16,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(7px)',
      WebkitBackdropFilter: 'blur(7px)',
    } as any),
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
