import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Bomb } from 'lucide-react-native';

interface BombTimerProps {
  timeLeft: number;
  totalTime: number;
}

export const BombTimer: React.FC<BombTimerProps> = ({ timeLeft, totalTime }) => {
  const progress = useRef(new Animated.Value(1)).current; // 1 to 0
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const currentProgress = Math.max(0, timeLeft / totalTime);
    
    // Animate progress smoothly
    Animated.timing(progress, {
      toValue: currentProgress,
      duration: 100,
      useNativeDriver: false, // Color interpolation requires false
    }).start();

    // Pulse animation logic
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stop();
    }
    
    const pulseDuration = Math.max(100, currentProgress * 500);
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: pulseDuration,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: pulseDuration,
          useNativeDriver: false,
        }),
      ])
    );
    pulseAnimRef.current.start();
    
    return () => {
      if (pulseAnimRef.current) pulseAnimRef.current.stop();
    };
  }, [timeLeft, totalTime]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 1], // Scale goes 1 -> 1.5 as progress goes 1 -> 0
  });

  const color = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FF0000', '#FFA500', '#000000'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View 
          style={[
            styles.bombCircle, 
            { 
              backgroundColor: color,
              transform: [{ scale: pulse }]
            }
          ]}
        >
          <Bomb color="#FFF" size={64} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
  },
  bombCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
