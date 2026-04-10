import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '../theme';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

export default function AnimatedCheckbox({ checked, onToggle, size = 22 }: AnimatedCheckboxProps) {
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (checked) {
      progress.value = withSpring(1, { damping: 15, stiffness: 200 });
      scale.value = withSequence(
        withSpring(1.25, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
    } else {
      progress.value = withSpring(0, { damping: 15, stiffness: 200 });
      scale.value = 1;
    }
  }, [checked]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.textMuted, Colors.primary]
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', Colors.primary]
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          outerStyle,
        ]}
      >
        <Animated.Text style={[styles.check, checkStyle, { fontSize: size * 0.55 }]}>
          ✓
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: Colors.white,
    fontWeight: '700',
  },
});
