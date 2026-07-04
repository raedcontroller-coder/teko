import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, Animated, ActivityIndicator, Pressable, Modal, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Mic, ArrowLeft, Bomb, Play, Frown, X, Flame, CheckCircle, AlertCircle, Loader2, Sparkles, Trophy } from 'lucide-react-native';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { getRandomCategory, GameCategory } from '../../data/categories';
import Svg, { Path, Circle, G, Line, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

export interface BombaGameProps {
  onBack: () => void;
}

export const BombaGame: React.FC<BombaGameProps> = ({ onBack }) => {
  const [category, setCategory] = useState<GameCategory | null>(null);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  const soundsRef = useRef<{ timer: Audio.Sound | null; explosion: Audio.Sound | null; success: Audio.Sound | null }>({
    timer: null,
    explosion: null,
    success: null,
  });
  
  // Temporizador
  const INITIAL_TIME = 60000;
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [tickSpeed, setTickSpeed] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [usedWords, setUsedWords] = useState<Record<string, string[]>>({});
  const isGameOverRef = useRef(false);
  const lastHapticTimeRef = useRef(0);
  
  // Animações
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerScaleAnim = useRef(new Animated.Value(1)).current;
  const explosionScaleAnim = useRef(new Animated.Value(1)).current;
  const flashOpacityAnim = useRef(new Animated.Value(0)).current;
  
  const { isRecording, isValidating, warmUpRecording, startRecording, stopRecordingAndValidate, cancelRecording } = useAudioRecorder();

  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (title: string, desc: string, type: 'success' | 'error') => {
    setToastMessage({ title, desc, type });
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => {
      setToastMessage(null);
    });
  };

  const [showExitModal, setShowExitModal] = useState(false);

  const confirmExit = () => {
    setShowExitModal(false);
    cancelRecording(); // Fecha canal de áudio se sair no meio
    onBack();
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  const handleRequestExit = () => {
    setShowExitModal(true);
  };

  const renderExitModal = () => (
    <Modal visible={showExitModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.exitModalCard}>
          <TouchableOpacity style={styles.closeModalButton} onPress={cancelExit}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>

          <View style={styles.frownIconWrapper}>
            <Frown color="#FFC857" size={48} />
          </View>

          <Text style={styles.exitModalTitle}>Puxa vida...</Text>
          <Text style={styles.exitModalText}>
            Você já vai embora?{'\n'}A bomba estava prestes a estourar!
          </Text>

          <View style={styles.exitModalButtons}>
            <Pressable 
              style={({ pressed }) => [styles.stayButton, pressed && { backgroundColor: '#7B61FF' }]}
              onPress={cancelExit}
            >
              {({ pressed }) => (
                <Text style={[styles.stayButtonText, pressed && { color: '#FFF' }]}>Quero Ficar!</Text>
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

  const startGame = () => {
    setCategory(getRandomCategory(1));
    setTimeLeft(INITIAL_TIME);
    setTickSpeed(100);
    setLevel(1);
    setValidationError(null);
    setToastMessage(null);
    setUsedWords({});
    setGameOver(false);
    isGameOverRef.current = false;
    setIsPlaying(true);
    
    shakeAnim.setValue(0);
    pulseAnim.setValue(1);
    timerScaleAnim.setValue(1);
    explosionScaleAnim.setValue(1);
    flashOpacityAnim.setValue(0);
    setIsExploding(false);

    // Garante que o microfone esteja completamente resetado antes de começar
    cancelRecording();
    
    // Aquece o microfone assim que o jogo começa para eliminar delay no primeiro uso
    warmUpRecording();
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadSounds = async () => {
      try {
        const { sound: tSound } = await Audio.Sound.createAsync(require('../../../assets/temporizador.mp3'));
        await tSound.setIsLoopingAsync(true);
        await tSound.setVolumeAsync(0.3);

        const { sound: eSound } = await Audio.Sound.createAsync(require('../../../assets/explosao_bomba.mp3'));
        await eSound.setVolumeAsync(0.5);

        const { sound: sSound } = await Audio.Sound.createAsync(require('../../../assets/proximo-nivel.mp3'));
        await sSound.setVolumeAsync(0.5);

        if (isMounted) {
          soundsRef.current = { timer: tSound, explosion: eSound, success: sSound };
          setSoundsLoaded(true);
        }
      } catch (e) {
        console.error("Erro ao carregar sons da bomba", e);
        if (isMounted) setSoundsLoaded(true);
      }
    };
    
    loadSounds();

    return () => {
      isMounted = false;
      soundsRef.current.timer?.unloadAsync();
      soundsRef.current.explosion?.unloadAsync();
      soundsRef.current.success?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (soundsRef.current.timer) {
      if (isPlaying && !gameOver && !isValidating) {
        soundsRef.current.timer.playAsync();
      } else {
        soundsRef.current.timer.pauseAsync();
      }
    }
  }, [isPlaying, gameOver, isValidating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && !gameOver && !isValidating) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - tickSpeed;

          // Feedback tátil progressivo nos últimos 10 segundos
          if (next > 0 && next <= 10000) {
            const now = Date.now();
            let threshold = 1000;
            let style = Haptics.ImpactFeedbackStyle.Light;

            if (next <= 3000) {
              threshold = 100;
              style = Haptics.ImpactFeedbackStyle.Heavy;
            } else if (next <= 6000) {
              threshold = 400;
              style = Haptics.ImpactFeedbackStyle.Medium;
            }

            if (now - lastHapticTimeRef.current >= threshold) {
              Haptics.impactAsync(style);
              lastHapticTimeRef.current = now;
            }
          }

          // O estado de game over agora será verificado num useEffect independente
          return next <= 0 ? 0 : next;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, isValidating, tickSpeed]);

  // Efeito independente para lidar com a Explosão e o fim do tempo (GameOver)
  useEffect(() => {
    if (isPlaying && timeLeft <= 0 && !isGameOverRef.current) {
      isGameOverRef.current = true;
      setIsPlaying(false);
      setIsExploding(true);
      
      cancelRecording(); // Força o fechamento do canal de áudio se o tempo esgotar
      soundsRef.current.explosion?.replayAsync();
      Vibration.vibrate(2000); // Vibração contínua única e explosiva no final
      
      Animated.parallel([
        Animated.timing(explosionScaleAnim, {
          toValue: 20,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setGameOver(true);
        setIsExploding(false);
        Animated.timing(flashOpacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [timeLeft, isPlaying]);

  // Efeitos visuais de Tensão (< 5s)
  useEffect(() => {
    if (isPlaying && timeLeft <= 5000 && !isValidating) {
      // Shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start();

      // Timer Pulse
      Animated.sequence([
        Animated.timing(timerScaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.timing(timerScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [timeLeft, isPlaying, isValidating]);

  const handleMicPress = async () => {
    if (!category || isValidating) return;

    if (isRecording) {
      const categoryUsedWords = usedWords[category.name] || [];
      const response = await stopRecordingAndValidate(category.name, categoryUsedWords);
      
      if (isGameOverRef.current) return;

      if (response) {
        if (response.valid) {
          soundsRef.current.success?.replayAsync();
          setTimeLeft((prev) => prev + 5000);
          setTickSpeed((prev) => prev * 1.10);
          
          setUsedWords(prev => ({
            ...prev,
            [category.name]: [...(prev[category.name] || []), response.transcription]
          }));

          const nextLevel = level + 1;
          setLevel(nextLevel);
          const newCategory = getRandomCategory(nextLevel);
          setCategory(newCategory);
          
          showToast('Boa!', '+1 Ponto!', 'success');
          warmUpRecording();
        } else {
          setValidationError(response.message || `Ouvi "${response.transcription}", mas não combina com ${category.name}.`);
          warmUpRecording();
        }
      } else {
        setValidationError('Algo deu errado. Tenta de novo!');
        warmUpRecording();
      }
    } else {
      setValidationError(null); // Limpa o erro ao tentar de novo
      await startRecording();
    }
  };

  // Cálculo de Renderização
  const t = Math.max(0, Math.min(1, timeLeft / INITIAL_TIME)); // t vai de 1 (cheio) a 0 (estourou)

  // Curva de Bezier Original:
  // P0 (Base da Bomba) = (256, 120)
  // P1 (Ponto de Controle) = (256, 20)
  // P2 (Ponta da Corda) = (360, 40)

  // Posição da chama (Ponto exato na curva de Bezier no tempo t)
  const flameX = Math.pow(1 - t, 2) * 256 + 2 * (1 - t) * t * 256 + Math.pow(t, 2) * 360;
  const flameY = Math.pow(1 - t, 2) * 120 + 2 * (1 - t) * t * 20 + Math.pow(t, 2) * 40;

  // Novo ponto de controle da curva (De Casteljau) para desenhar apenas o que restou da corda:
  // P1_novo = interpolar entre P0 e P1 por t
  // Como P0.x = 256 e P1.x = 256, o X do controle será sempre 256
  const controlY = (1 - t) * 120 + t * 20;

  const isTense = timeLeft <= 5000;
  const bombColor = isTense ? '#7f1d1d' : '#1f2937';

  // Format Timer
  const totalSeconds = Math.ceil(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  if (!soundsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.menuContent}>
          <ActivityIndicator size="large" color="#FFC857" />
          <Text style={[styles.title, { marginTop: 24, fontSize: 20 }]}>Preparando a Bomba...</Text>
        </View>
      </View>
    );
  }

  if (!isPlaying && !gameOver && !isExploding) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.menuContent}>
          <View style={styles.iconWrapper}>
            <Bomb color="#FFC857" size={64} />
          </View>
          <Text style={styles.title}>Jogo da Bomba</Text>
          
          <View style={styles.glassPanel}>
            <Text style={styles.instructions}>
              Fale rápido uma palavra da categoria certa para trocar a categoria e recarregar a bomba antes que ela estoure!
            </Text>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.startButton,
              pressed && { backgroundColor: '#7B61FF' }
            ]} 
            onPress={startGame}
          >
            {({ pressed }) => (
              <Text style={[styles.startButtonText, pressed && { color: '#FFF' }]}>Começar a Jogar</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  if (gameOver && !isExploding) {
    return (
      <View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: flashOpacityAnim, zIndex: 999, elevation: 999 }]} pointerEvents="none" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.gameOverTitle}>Fim de Jogo</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.kaboomCenter}>
          <View style={styles.heroIconWrapperSimple}>
            <Trophy color="#FFC857" size={80} />
          </View>
          
          <View style={styles.scoreContainerSimple}>
            <Text style={styles.feedbackTitleSimple}>O tempo acabou!</Text>
            <Text style={styles.feedbackDescSimple}>Você jogou muito bem, sua pontuação foi:</Text>

            <Text style={styles.finalScoreValueSimple}>{level}</Text>
            <Text style={styles.finalScoreLabelSimple}>{level === 1 ? 'PONTO' : 'PONTOS'}</Text>
          </View>
        </View>

        <View style={styles.gameOverBottomSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.playAgainButton,
              pressed && { backgroundColor: '#7B61FF' }
            ]} 
            onPress={startGame}
          >
            {({ pressed }) => (
              <>
                <Play color={pressed ? "#FFF" : "#084D48"} size={24} fill={pressed ? "#FFF" : "#084D48"} />
                <Text style={[styles.playAgainTextSimple, pressed && { color: '#FFF' }]}>Jogar Novamente</Text>
              </>
            )}
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.backHomeButton,
              pressed && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            ]} 
            onPress={onBack}
          >
            {({ pressed }) => (
              <Text style={[styles.backHomeText, pressed && { color: '#FFF' }]}>Voltar ao Início</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: flashOpacityAnim, zIndex: 999, elevation: 999 }]} pointerEvents="none" />
      
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={[styles.toastIconBox, toastMessage.type === 'error' ? styles.toastIconBoxError : styles.toastIconBoxSuccess]}>
            {toastMessage.type === 'error' ? <Frown color="#EF4444" size={32} /> : <CheckCircle color="#10B981" size={32} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{toastMessage.title}</Text>
            <Text style={styles.toastDesc}>{toastMessage.desc}</Text>
          </View>
        </Animated.View>
      )}

      {renderExitModal()}
      {/* Header Segura */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRequestExit} style={styles.iconButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: timerScaleAnim }] }]}>
          <Text style={[styles.timerText, isTense && styles.timerTextDanger]}>
            {minutes}:{seconds}
          </Text>
          <Text style={styles.timerLabel}>Tempo Restante</Text>
        </Animated.View>

        <View style={{ width: 44 }} />
      </View>

      {/* Cards de Categoria e Nível */}
      <View style={styles.topSection}>
        <View style={styles.categoryLevelPanel}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryLabel}>O tema é...</Text>
            <Text style={styles.categoryValue}>{category?.name}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>PONTOS</Text>
            <Text style={styles.levelValue}>{level}</Text>
          </View>
        </View>
      </View>

      {/* Jogo: SVG Bomb */}
      <View style={styles.stage}>
        <Animated.View style={[styles.bombWrapper, { transform: [{ translateX: shakeAnim }, { scale: explosionScaleAnim }] }]}>
          <Svg width="100%" height="100%" viewBox="0 0 512 512" style={{ overflow: 'visible' }}>
            <Defs>
              <RadialGradient id="bombGradient" cx="40%" cy="40%" r="70%">
                <Stop offset="0%" stopColor="#4B5563" />
                <Stop offset="100%" stopColor={bombColor} />
              </RadialGradient>
            </Defs>
            
            <Ellipse cx="256" cy="460" rx="120" ry="25" fill="black" fillOpacity="0.2" />
            
            {/* Pavio (Corda) Dinâmico (Sempre conectado do pavio à chama) */}
            <Path 
              d={`M256 120 Q256 ${controlY} ${flameX} ${flameY}`} 
              fill="none" 
              stroke="#D97706" 
              strokeWidth="12" 
              strokeLinecap="round" 
            />
            
            {/* Chama dinâmica baseada na bezier */}
            {t > 0 && (
              <G transform={`translate(${flameX}, ${flameY})`}>
                <Circle r="14" fill="#FDE047" opacity={0.8} />
                <G stroke="#EAB308" strokeWidth="6" strokeLinecap="round">
                  <Line x1="0" y1="-25" x2="0" y2="25" />
                  <Line x1="-25" y1="0" x2="25" y2="0" />
                  <Line x1="-18" y1="-18" x2="18" y2="18" />
                  <Line x1="-18" y1="18" x2="18" y2="-18" />
                </G>
                <Circle r="6" fill="white" />
              </G>
            )}

            {/* Corpo da Bomba */}
            <Path d="M220 105 H292 C302 105 310 113 310 123 V145 H202 V123 C202 113 210 105 220 105 Z" fill="#374151" />
            <Circle cx="256" cy="290" r="170" fill="url(#bombGradient)" />
            <Ellipse cx="180" cy="190" rx="50" ry="30" fill="white" fillOpacity="0.15" transform="rotate(-35, 180, 190)" />
          </Svg>
        </Animated.View>
      </View>

      {/* Controles de Voz */}
      <View style={styles.bottomSection}>
        {isValidating ? (
          <View style={[styles.glassPanel, styles.processingChip]}>
            <ActivityIndicator size="small" color="#FFC857" />
            <Text style={styles.processingText}>Ouvindo...</Text>
          </View>
        ) : validationError ? (
          <View style={[styles.glassPanel, styles.errorChip]}>
            <AlertCircle color="#EF4444" size={20} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        ) : (
          <View style={{ height: 44 }} /> // Placeholder to avoid jumping UI
        )}

        <TouchableOpacity 
          style={[
            styles.micButton, 
            isRecording && styles.micButtonRecording,
            isValidating && styles.micButtonProcessing
          ]}
          onPress={handleMicPress}
          activeOpacity={0.8}
          disabled={isValidating}
        >
          <Mic color={isRecording ? "#FFF" : "#084D48"} size={48} />
        </TouchableOpacity>
        
        <Text style={styles.micInstruction}>
          {isRecording ? 'Clique para enviar' : 'Clique para falar'}
        </Text>
      </View>
    </View>
  );
};

const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#084D48',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop,
    paddingBottom: 16,
    zIndex: 50,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  timerTextDanger: {
    color: '#ba1a1a',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  topSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  categoryLevelPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9bf2e8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFC857',
    flexWrap: 'wrap',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.3)',
    marginLeft: 16,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFC857',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12,
  },
  turnIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5b3cdd',
    shadowColor: '#5b3cdd',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  turnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bombWrapper: {
    width: 320,
    height: 320,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40, 
    alignItems: 'center',
    gap: 24,
  },
  gameOverBottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Empurra consideravelmente para cima
    alignItems: 'center',
    gap: 12, // Gap bem reduzido para aproximar os botões
    width: '100%',
  },
  processingChip: {
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 99,
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    borderColor: 'rgba(255, 200, 87, 0.4)',
  },
  processingText: {
    color: '#FFC857',
    fontSize: 14,
    fontWeight: '700',
  },
  errorChip: {
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#7f1d1d', // Vermelho mais forte e escuro
    borderWidth: 2,
    borderColor: '#EF4444', // Borda vermelha brilhante
  },
  errorText: {
    color: '#FFFFFF', // Texto totalmente branco
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFC857',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  micButtonRecording: {
    backgroundColor: '#5b3cdd',
    shadowColor: '#5b3cdd',
  },
  micButtonProcessing: {
    backgroundColor: 'rgba(255, 200, 87, 0.5)', // Mic opaco e bloqueado visualmente
    shadowOpacity: 0,
    elevation: 0,
  },
  micInstruction: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  menuContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 87, 0.4)',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -1,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 28,
  },
  startButton: {
    backgroundColor: '#FFC857',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 40,
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#084D48',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  backButton: {
    position: 'absolute',
    top: paddingTop,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  boomText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFC857', // yellow to match aesthetic
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  loserText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#FFF',
    paddingHorizontal: 40,
    marginBottom: 60,
  },
  gameOverTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kaboomCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroIconWrapperSimple: {
    marginBottom: 24,
  },
  scoreContainerSimple: {
    alignItems: 'center',
    width: '100%',
  },
  feedbackTitleSimple: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackDescSimple: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  finalScoreValueSimple: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFC857',
    lineHeight: 80,
  },
  finalScoreLabelSimple: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFC857',
    letterSpacing: 2,
    marginBottom: 40,
  },
  playAgainTextSimple: {
    color: '#084D48',
    fontSize: 20,
    fontWeight: '900',
  },
  heroIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  feedbackCardOver: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFC857',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  feedbackDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  playAgainButton: {
    backgroundColor: '#FFC857',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 99,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8, // Brought closer to the backHomeButton
  },
  playAgainText: {
    color: '#084D48',
    fontSize: 18,
    fontWeight: '900',
  },
  backHomeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 99,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backHomeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  exitModalCard: {
    backgroundColor: '#181c1c',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  closeModalButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  frownIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.3)',
  },
  exitModalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  exitModalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exitModalButtons: {
    width: '100%',
    gap: 12,
  },
  stayButton: {
    backgroundColor: '#FFC857',
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  stayButtonText: {
    color: '#084D48',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leaveButton: {
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    backgroundColor: '#181c1c',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  toastIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toastIconBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  toastIconBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  toastTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  toastDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});
