import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';

interface TekoLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}

export const TekoLoadingSpinner: React.FC<TekoLoadingSpinnerProps> = ({
  size = 'medium',
  color = theme.colors.primary,
  message,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop de pulsação suave
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loop de rotação suave
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerDimensions = size === 'small' ? 24 : size === 'medium' ? 40 : 56;
  const indicatorSize = size === 'small' ? 'small' : 'large';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinnerAura,
          {
            width: spinnerDimensions + 16,
            height: spinnerDimensions + 16,
            borderRadius: (spinnerDimensions + 16) / 2,
            opacity: pulseAnim,
            backgroundColor: theme.colors.tealMint,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.spinnerBox,
          {
            width: spinnerDimensions,
            height: spinnerDimensions,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <ActivityIndicator size={indicatorSize} color={color} />
      </Animated.View>

      {message && <Text style={styles.messageText}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  spinnerAura: {
    position: 'absolute',
  },
  spinnerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
