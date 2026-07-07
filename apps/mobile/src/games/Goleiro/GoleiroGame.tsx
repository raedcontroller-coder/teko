import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, 
  Image, Animated, Pressable, Modal, Easing, Dimensions
} from 'react-native';
import { Shield, ArrowLeft, Trophy, Play, X, Frown, Activity } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface GoleiroGameProps {
  onBack: () => void;
}

const TOTAL_SHOTS = 20;

export const GoleiroGame: React.FC<GoleiroGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'playing' | 'timeout'>('menu');
  const [menuStep, setMenuStep] = useState<1 | 2>(1);
  const [countdownValue, setCountdownValue] = useState<number | string>(3);
  const [showExitModal, setShowExitModal] = useState(false);
  const [score, setScore] = useState(0); // number of saves
  const [currentShot, setCurrentShot] = useState(0); // total shots taken
  
  // Ball state
  const [isBallActive, setIsBallActive] = useState(false);
  const [ballX, setBallX] = useState('50%');
  const [ballY, setBallY] = useState('50%');
  const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);

  // Anims
  const ballScaleAnim = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  
  // Refs
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ballAppearTimeRef = useRef<number>(0);
  const isShotProcessedRef = useRef(false);

  // Metrics
  const reactionTimesRef = useRef<number[]>([]);

  // Audio
  const soundsRef = useRef<{ 
    success: Audio.Sound | null; 
    error: Audio.Sound | null; 
    win: Audio.Sound | null 
  }>({
    success: null,
    error: null,
    win: null,
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadSounds = async () => {
      try {
        const { sound: success } = await Audio.Sound.createAsync(require('../../../assets/click_correto_gonogo.mp3'));
        const { sound: error } = await Audio.Sound.createAsync(require('../../../assets/click_incorreto_gonogo.mp3'));
        const { sound: win } = await Audio.Sound.createAsync(require('../../../assets/venceu-jogo.mp3'));
        
        await success.setVolumeAsync(1.0);
        await error.setVolumeAsync(1.0);
        await win.setVolumeAsync(1.0);

        if (isMounted) {
          soundsRef.current = { success, error, win };
        }
      } catch (e) {
        console.error("Erro ao carregar sons", e);
      }
    };
    
    loadSounds();

    return () => {
      isMounted = false;
      soundsRef.current.success?.unloadAsync();
      soundsRef.current.error?.unloadAsync();
      soundsRef.current.win?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const clearAllTimeouts = () => {
    if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
    if (shotTimeoutRef.current) clearTimeout(shotTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleRequestExit = () => setShowExitModal(true);
  const cancelExit = () => setShowExitModal(false);
  const confirmExit = () => {
    setShowExitModal(false);
    clearAllTimeouts();
    onBack();
  };

  const startCountdown = () => {
    setGameState('countdown');
    setCountdownValue(3);
    let count = 3;

    const runAnimation = () => {
      countdownAnim.setValue(0);
      Animated.timing(countdownAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    runAnimation();

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        runAnimation();
      } else if (count === 0) {
        setCountdownValue('JÁ!');
        runAnimation();
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        startGame();
      }
    }, 1000);
  };

  const startGame = () => {
    setScore(0);
    setCurrentShot(0);
    reactionTimesRef.current = [];
    setGameState('playing');
    setMenuStep(1);
    setIsBallActive(false);
    queueNextShot(0);
  };

  const queueNextShot = (current: number) => {
    if (current >= TOTAL_SHOTS) {
      endGame();
      return;
    }
    
    // Intervalo aleatório antes do chute: 1 a 2.5 segundos
    const delay = Math.floor(Math.random() * 1500) + 1000;
    spawnTimeoutRef.current = setTimeout(() => spawnBall(current), delay);
  };

  const spawnBall = (current: number) => {
    setCurrentShot(current + 1);
    isShotProcessedRef.current = false;
    
    // Random position na tela para a bola finalizar a animação
    // Consideramos uma margem de segurança
    const randomX = Math.floor(Math.random() * 60) + 20; // 20% a 80%
    const randomY = Math.floor(Math.random() * 50) + 20; // 20% a 70%
    setBallX(`${randomX}%`);
    setBallY(`${randomY}%`);
    
    setIsBallActive(true);
    setFlashType(null);
    ballAppearTimeRef.current = Date.now();

    // Duração do chute: 4, 5 ou 6 segundos (4000 a 6000 ms)
    const possibleDurations = [4000, 5000, 6000];
    const shotDuration = possibleDurations[Math.floor(Math.random() * possibleDurations.length)];

    ballScaleAnim.setValue(0);
    Animated.timing(ballScaleAnim, {
      toValue: 1,
      duration: shotDuration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();

    shotTimeoutRef.current = setTimeout(() => {
      if (!isShotProcessedRef.current) {
        handleMiss();
      }
    }, shotDuration);
  };

  const handleSave = () => {
    if (isShotProcessedRef.current) return;
    isShotProcessedRef.current = true;
    
    if (shotTimeoutRef.current) clearTimeout(shotTimeoutRef.current);
    ballScaleAnim.stopAnimation();
    
    const reactionTime = Date.now() - ballAppearTimeRef.current;
    reactionTimesRef.current.push(reactionTime);

    setScore(prev => prev + 1);
    setFlashType('success');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    soundsRef.current.success?.replayAsync();
    
    setTimeout(() => {
      setIsBallActive(false);
      setFlashType(null);
      queueNextShot(currentShot);
    }, 500);
  };

  const handleMiss = () => {
    if (isShotProcessedRef.current) return;
    isShotProcessedRef.current = true;
    
    setFlashType('error');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    soundsRef.current.error?.replayAsync();
    
    setTimeout(() => {
      setIsBallActive(false);
      setFlashType(null);
      queueNextShot(currentShot);
    }, 800);
  };

  const endGame = () => {
    setGameState('timeout');
    clearAllTimeouts();
    soundsRef.current.win?.replayAsync();
    
    // Here we can log telemetry in the future
    console.log("Game Ended", {
      score,
      totalShots: TOTAL_SHOTS,
      reactionTimes: reactionTimesRef.current
    });
  };

  const renderExitModal = () => (
    <Modal visible={showExitModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.menuBox}>
          <TouchableOpacity style={styles.closeModalButton} onPress={cancelExit}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>
          
          <View style={styles.frownIconWrapper}>
            <Frown color="#FFC857" size={48} />
          </View>
          <Text style={styles.exitModalTitle}>Puxa vida...</Text>
          <Text style={styles.exitModalText}>Você já vai embora?{'\n'}O campeonato não acabou!</Text>
          
          <View style={styles.exitModalButtons}>
            <Pressable 
              onPress={cancelExit} 
              style={({ pressed }) => [styles.stayButton, pressed && styles.playButtonPressed]}
            >
              {({ pressed }) => (
                <Text style={[styles.stayButtonText, pressed && { color: '#FFF' }]}>Quero ficar!</Text>
              )}
            </Pressable>

            <TouchableOpacity style={styles.leaveButton} onPress={confirmExit}>
              <Text style={styles.leaveButtonText}>Sair do Jogo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderExitModal()}
      
      <ImageBackground 
        source={isBallActive 
          ? require('../../../assets/assets_goleiro/bola_chutada.png') 
          : require('../../../assets/assets_goleiro/campo_futebol.png')
        } 
        style={styles.container}
        resizeMode="cover"
      >
        {/* Flash Overlays */}
        {flashType === 'success' && <View style={[styles.flashOverlay, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />}
        {flashType === 'error' && <View style={[styles.flashOverlay, { backgroundColor: 'rgba(255, 0, 0, 0.4)' }]} />}

        {/* Global Header during play */}
        <View style={styles.header} pointerEvents="box-none">
          {gameState === 'playing' && (
            <TouchableOpacity onPress={handleRequestExit} style={styles.backButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          )}
          {gameState === 'playing' && (
            <View style={styles.centerTopStats} pointerEvents="none">
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>
                  Chutes: {currentShot}/{TOTAL_SHOTS}
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Shield color="#FFD700" size={16} />
                <Text style={styles.scoreText}>{score}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Luvas do Goleiro (always visible when playing or waiting for play) */}
        {(gameState === 'playing' || gameState === 'countdown') && (
          <View style={styles.glovesContainer} pointerEvents="none">
            <Image 
              source={require('../../../assets/assets_goleiro/luvas_goleiro.png')} 
              style={styles.glovesImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Menu State */}
        {gameState === 'menu' && (
          <View style={styles.centerContent}>
            <View style={styles.menuBox}>
              {menuStep === 1 && (
                <>
                  <Text style={styles.title}>Goleiro</Text>
                  <Text style={styles.subtitle}>Teste seus reflexos! Defenda todas as bolas antes que elas entrem no gol.</Text>
                  
                  <Pressable 
                    style={({ pressed }) => [
                      styles.playButton,
                      pressed && styles.playButtonPressed
                    ]}
                    onPress={() => setMenuStep(2)}
                  >
                    {({ pressed }) => (
                      <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>PRÓXIMO</Text>
                    )}
                  </Pressable>
                </>
              )}

              {menuStep === 2 && (
                <>
                  <View style={styles.tutorialImageContainer}>
                    <Shield color="#FFC857" size={48} />
                  </View>
                  <Text style={styles.title}>Como Jogar</Text>
                  <Text style={styles.subtitle}>
                    Fique atento! Quando a bola vier na sua direção, toque nela o mais rápido possível para fazer a defesa.
                  </Text>
                  
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setMenuStep(1)}>
                      <Text style={styles.secondaryButtonText}>VOLTAR</Text>
                    </TouchableOpacity>
                    
                    <Pressable 
                      style={({ pressed }) => [
                        styles.playButton,
                        pressed && styles.playButtonPressed
                      ]}
                      onPress={startCountdown}
                    >
                      {({ pressed }) => (
                        <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>COMEÇAR!</Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Countdown State */}
        {gameState === 'countdown' && (
          <View style={[styles.centerContent, styles.countdownOverlay]}>
            <Animated.Text 
              style={[
                styles.countdownText, 
                { 
                  opacity: countdownAnim,
                  transform: [{
                    scale: countdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1]
                    })
                  }]
                }
              ]}
            >
              {countdownValue}
            </Animated.Text>
          </View>
        )}

        {/* Playing State */}
        {gameState === 'playing' && isBallActive && (
          <Pressable style={StyleSheet.absoluteFill} onPress={handleSave}>
            <Animated.View style={[
              styles.ballContainer,
              {
                left: ballX,
                top: ballY,
                transform: [
                  { translateX: -50 },
                  { translateY: -50 },
                  { scale: ballScaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 2.5]
                  })}
                ]
              }
            ]}>
              <Image 
                source={require('../../../assets/assets_goleiro/soccer-ball-cartoon-icon-png.webp')}
                style={styles.ballImage}
                resizeMode="contain"
              />
            </Animated.View>
          </Pressable>
        )}

        {/* Timeout State */}
        {gameState === 'timeout' && (
          <View style={styles.centerContent}>
            <View style={styles.menuBox}>
              <Trophy color="#FFC857" size={64} style={{ marginBottom: 16 }} />
              <Text style={styles.title}>Fim de Jogo!</Text>
              <Text style={styles.subtitle}>
                Você é um paredão! Defendeu <Text style={{ color: '#FFC857', fontWeight: 'bold' }}>{score}</Text> de {TOTAL_SHOTS} chutes hoje.
              </Text>
              
              <View style={styles.actionButtonsRow}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed
                  ]}
                  onPress={onBack}
                >
                  {({ pressed }) => (
                    <Text style={[styles.secondaryButtonText, pressed && { color: '#7B61FF' }]}>Sair do Jogo</Text>
                  )}
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed && styles.playButtonPressed
                  ]}
                  onPress={startGame}
                >
                  {({ pressed }) => (
                    <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>JOGAR NOVAMENTE</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}

      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 40,
    zIndex: 50,
  },
  centerTopStats: {
    position: 'absolute',
    top: '2%',
    left: '50%',
    transform: [{ translateX: -70 }],
    alignItems: 'center',
    gap: 6,
    zIndex: 60,
  },
  timerBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  frownIconWrapper: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,200,87,0.1)',
    padding: 16,
    borderRadius: 50,
  },
  exitModalTitle: {
    color: '#FFC857',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  exitModalText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  exitModalButtons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  stayButton: {
    backgroundColor: '#FFC857',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 99,
    alignItems: 'center',
  },
  stayButtonText: {
    color: '#084D48',
    fontSize: 16,
    fontWeight: '900',
  },
  leaveButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 99,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBox: {
    backgroundColor: 'rgba(24, 28, 28, 0.95)',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    maxWidth: 600,
    minHeight: 340,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  tutorialImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#FFC857',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  playButtonPressed: {
    backgroundColor: '#7B61FF',
    shadowColor: '#7B61FF',
    borderColor: '#7B61FF',
    transform: [{ scale: 0.96 }],
  },
  playButtonText: {
    color: '#084D48',
    fontSize: 20,
    fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  secondaryButtonPressed: {
    borderColor: '#7B61FF',
    transform: [{ scale: 0.96 }],
  },
  secondaryButtonText: {
    color: '#FFC857',
    fontSize: 20,
    fontWeight: '900',
  },
  countdownOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    ...StyleSheet.absoluteFillObject,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 16,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  glovesContainer: {
    position: 'absolute',
    bottom: -80,
    width: '100%',
    height: 300,
    alignItems: 'center',
    zIndex: 30,
  },
  glovesImage: {
    width: '60%',
    height: '100%',
    opacity: 0.9,
  },
  ballContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    zIndex: 40,
  },
  ballImage: {
    width: '100%',
    height: '100%',
  }
});
