import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, DimensionValue } from 'react-native';
import { theme } from '../../theme/theme';

interface SkeletonLoaderProps {
  variant?: 'card' | 'metric' | 'text' | 'avatar';
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  width,
  height,
  borderRadius,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 750,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (variant === 'card') {
    return (
      <View style={[styles.cardSkeletonContainer, style]}>
        <Animated.View style={[styles.avatarSkeleton, { opacity: opacityAnim }]} />
        <View style={styles.textSkeletonGroup}>
          <Animated.View style={[styles.lineSkeleton, { width: '60%', opacity: opacityAnim }]} />
          <Animated.View style={[styles.lineSkeletonSub, { width: '40%', opacity: opacityAnim }]} />
        </View>
        <Animated.View style={[styles.badgeSkeleton, { opacity: opacityAnim }]} />
      </View>
    );
  }

  if (variant === 'metric') {
    return (
      <View style={[styles.metricSkeletonContainer, style]}>
        <Animated.View style={[styles.iconSkeleton, { opacity: opacityAnim }]} />
        <Animated.View style={[styles.valueSkeleton, { opacity: opacityAnim }]} />
        <Animated.View style={[styles.lineSkeletonSub, { width: '70%', opacity: opacityAnim }]} />
      </View>
    );
  }

  if (variant === 'avatar') {
    return (
      <Animated.View
        style={[
          styles.avatarSkeleton,
          width ? { width } : null,
          height ? { height } : null,
          borderRadius ? { borderRadius } : null,
          { opacity: opacityAnim },
          style,
        ]}
      />
    );
  }

  // Default 'text'
  return (
    <Animated.View
      style={[
        styles.customSkeleton,
        width ? { width } : null,
        height ? { height } : null,
        borderRadius ? { borderRadius } : null,
        { opacity: opacityAnim },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  cardSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 12,
    marginBottom: 10,
  },
  avatarSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.cardBorder,
  },
  textSkeletonGroup: {
    flex: 1,
    gap: 6,
  },
  lineSkeleton: {
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.cardBorder,
  },
  lineSkeletonSub: {
    height: 10,
    borderRadius: 3,
    backgroundColor: theme.colors.cardBorder,
  },
  badgeSkeleton: {
    width: 50,
    height: 20,
    borderRadius: 999,
    backgroundColor: theme.colors.cardBorder,
  },

  metricSkeletonContainer: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    justifyContent: 'space-between',
    gap: 12,
  },
  iconSkeleton: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cardBorder,
  },
  valueSkeleton: {
    width: 50,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.colors.cardBorder,
  },

  customSkeleton: {
    height: 16,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.cardBorder,
  },
});
