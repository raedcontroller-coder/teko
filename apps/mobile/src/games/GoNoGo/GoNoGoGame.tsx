import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Platform, StatusBar, Pressable, Animated, Modal, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { ArrowLeft, CheckCircle, RotateCcw, Flame, X, Frown, Play, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { STIMULI, StimulusType } from './data';
import { TelemetryLogger, ResponseType } from './TelemetryLogger';

interface GoNoGoGameProps {
  onBack: () => void;
}

type GameState = 'menu' | 'isi' | 'stimulus' | 'finished';

const TOTAL_TRIALS = 20;
const GO_RATIO = 0.7; // 14 Go, 6 No-Go

const generateSequence = () => {
  const goCount = Math.round(TOTAL_TRIALS * GO_RATIO);
  const nogoCount = TOTAL_TRIALS - goCount;
  
  const seq: StimulusType[] = [
    ...Array(goCount).fill('go'),
    ...Array(nogoCount).fill('nogo')
  ];

  // Fisher-Yates shuffle
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  
  return seq;
};

export const GoNoGoGame: React.FC<GoNoGoGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [sequence, setSequence] = useState<StimulusType[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Combos
  const [comboCount, setComboCount] = useState(0);

  // Animations
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(1)).current;
  const popOpacityAnim = useRef(new Animated.Value(1)).current;
  const xOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Flashy Combo Anim (Wobble)
  const comboWobbleAnim = useRef(new Animated.Value(0)).current;

  // Exit Modal
  const [showExitModal, setShowExitModal] = useState(false);

  const logger = useMemo(() => new TelemetryLogger(), []);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onsetTimeRef = useRef<number>(0);
  const isResponseLogged = useRef<boolean>(false);
  const soundsRef = useRef<{ correct: Audio.Sound | null, incorrect: Audio.Sound | null }>({ correct: null, incorrect: null });

  useEffect(() => {
    let isMounted = true;
    const loadSounds = async () => {
      try {
        const { sound: correctSound } = await Audio.Sound.createAsync(
          require('../../../assets/click_correto_gonogo.mp3')
        );
        const { sound: incorrectSound } = await Audio.Sound.createAsync(
          require('../../../assets/click_incorreto_gonogo.mp3')
        );
        
        // Acelera levemente o áudio de erro
        await incorrectSound.setRateAsync(1.5, true);

        if (isMounted) {
          soundsRef.current.correct = correctSound;
          soundsRef.current.incorrect = incorrectSound;
        }
      } catch (e) {
        console.warn('Erro ao carregar sons do GoNoGo:', e);
      }
    };
    loadSounds();

    return () => {
      isMounted = false;
      if (soundsRef.current.correct) soundsRef.current.correct.unloadAsync();
      if (soundsRef.current.incorrect) soundsRef.current.incorrect.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (comboCount >= 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(comboWobbleAnim, { toValue: -15, duration: 80, useNativeDriver: true }),
          Animated.timing(comboWobbleAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
          Animated.timing(comboWobbleAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(comboWobbleAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(comboWobbleAnim, { toValue: 0, duration: 80, useNativeDriver: true })
        ])
      ).start();
    } else {
      comboWobbleAnim.setValue(0);
    }
  }, [comboCount]);

  const startGame = () => {
    logger.clear();
    setSequence(generateSequence());
    setCurrentTrialIndex(0);
    setGameState('isi');
    setMetrics(null);
    setComboCount(0);
  };

  const confirmExit = () => {
    setShowExitModal(false);
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
            Você já vai embora?{'\n'}O teste ainda não terminou!
          </Text>

          <View style={styles.exitModalButtons}>
            <Pressable onPress={cancelExit}>
              {({ pressed }) => (
                <View style={[styles.stayButton, pressed && { backgroundColor: '#7B61FF' }]}>
                  <Text style={[styles.stayButtonText, pressed && { color: '#FFF' }]}>Quero Ficar!</Text>
                </View>
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

  const currentStimulusType = sequence[currentTrialIndex];
  const stimulusData = currentStimulusType ? STIMULI[currentStimulusType] : null;

  const nextTrial = () => {
    if (currentTrialIndex + 1 >= sequence.length) {
      setGameState('finished');
      const rawMetrics = logger.getRawMetrics();
      setMetrics(rawMetrics);
      
      // Envia os dados puros para o Python calcular o d' e Critério C
      (async () => {
        try {
          const response = await fetch('http://10.246.21.235:3002/api/gonogo/sdt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawMetrics)
          });
          const result = await response.json();
          
          console.log("\n\n=== TEORIA DA DETECÇÃO DOS SINAIS (TDS) - GO/NO-GO (PYTHON) ===");
          if (result.error) {
            console.log(`Erro/Aviso: ${result.error}`);
          } else {
            console.log(JSON.stringify(result, null, 2));
          }
          console.log("========================================================\n\n");
          
        } catch (e) {
          console.log("Erro ao chamar API de SDT", e);
        }
      })();
    } else {
      setCurrentTrialIndex(prev => prev + 1);
      setGameState('isi');
    }
  };

  const handleTimeout = () => {
    if (gameState === 'stimulus') {
      if (!isResponseLogged.current) {
        // Time expired without touch
        const responseType: ResponseType = currentStimulusType === 'go' ? 'miss' : 'correct_rejection';
        
        if (responseType === 'miss') {
          // Punição: perdeu o cão, o combo zera
          setComboCount(0);
        }

        logger.logEvent({
          stimulusType: currentStimulusType,
          stimulusOnset: onsetTimeRef.current,
          responseTimestamp: null,
          responseType,
          reactionTime: null,
        });
      }
      nextTrial();
    }
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (gameState === 'isi') {
      isResponseLogged.current = false;
      
      // Reset animations safely when the bubble is not being rendered
      popAnim.setValue(1);
      popOpacityAnim.setValue(1);
      xOpacityAnim.setValue(0);
      breathingAnim.setValue(1);
      shakeAnim.setValue(0);

      const isiDuration = Math.random() * 1000 + 500; // 500ms to 1500ms
      timeoutRef.current = setTimeout(() => {
        setGameState('stimulus');
      }, isiDuration);
      
    } else if (gameState === 'stimulus') {
      onsetTimeRef.current = performance.now();
      
      // Começa a animação de "Respiração" na bolha
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(breathingAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();

      timeoutRef.current = setTimeout(() => {
        handleTimeout();
      }, 1000); // Max window 1000ms
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [gameState, currentTrialIndex]);

  const handleScreenTouch = () => {
    if (gameState !== 'stimulus' || isResponseLogged.current) return;

    const touchTime = performance.now();
    const reactionTime = touchTime - onsetTimeRef.current;
    
    if (reactionTime <= 1000) {
      isResponseLogged.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current); // Previne timeout duplo
      
      const responseType: ResponseType = currentStimulusType === 'go' ? 'hit' : 'commission';
      
      if (responseType === 'hit') {
        soundsRef.current.correct?.replayAsync();
        setComboCount(prev => prev + 1);
        
        // Efeito de Estouro (Pop Out)
        Animated.parallel([
          Animated.timing(popAnim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
          Animated.timing(popOpacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();

      } else {
        soundsRef.current.incorrect?.replayAsync();
        Vibration.vibrate(400); // Vibração física intensa
        setComboCount(0); // Zera o combo ao cometer um erro
        
        // Efeito de Erro (Shake e X gigante)
        xOpacityAnim.setValue(1);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }

      logger.logEvent({
        stimulusType: currentStimulusType,
        stimulusOnset: onsetTimeRef.current,
        responseTimestamp: touchTime,
        responseType,
        reactionTime,
      });
      
      // Pequeno delay para a animação bater antes de passar pro próximo
      setTimeout(() => {
        nextTrial();
      }, responseType === 'hit' ? 150 : 350); // Se erro, espera mais pra ver o X
    }
  };

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        {renderExitModal()}
        <TouchableOpacity onPress={handleRequestExit} style={styles.backButtonTop}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.menuContent}>
          <Text style={styles.title}>Toca Rápido!</Text>
          
          <View style={styles.glassPanel}>
            <Text style={styles.instructionsTitle}>Fique muito atento!</Text>
            <Text style={styles.instructionsDesc}>
              Toque na tela o mais rápido que puder quando ver o Cachorro.{'\n\n'}
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>NÃO TOQUE</Text> na tela quando ver o Gato.
            </Text>

            <View style={styles.stimulusPreview}>
              <View style={styles.previewItem}>
                <View style={[styles.previewBubble, { backgroundColor: STIMULI.go.color, borderColor: STIMULI.go.shadowColor }]}>
                  <Text style={styles.emojiHuge}>{STIMULI.go.emoji}</Text>
                </View>
                <Text style={styles.previewText}>TOCAR</Text>
              </View>
              <View style={styles.previewItem}>
                <View style={[styles.previewBubble, { backgroundColor: STIMULI.nogo.color, borderColor: STIMULI.nogo.shadowColor }]}>
                  <Text style={styles.emojiHuge}>{STIMULI.nogo.emoji}</Text>
                </View>
                <Text style={styles.previewText}>ESTÁTUA</Text>
              </View>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.startButton,
              pressed && { backgroundColor: '#7B61FF', transform: [{ scale: 0.96 }] }
            ]} 
            onPress={startGame}
          >
            {({ pressed }) => (
              <>
                <Play color={pressed ? "#FFF" : "#084D48"} size={32} fill={pressed ? "#FFF" : "#084D48"} />
                <Text style={[styles.startButtonText, pressed && { color: '#FFF' }]}>Jogar!</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        {renderExitModal()}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleRequestExit} style={styles.iconButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.resultsContent}>
          <View style={styles.successIcon}>
            <CheckCircle color="#9bf2e8" size={64} />
          </View>
          <Text style={styles.finishedTitle}>Sessão Concluída</Text>
          
          {metrics && (
            <View style={styles.metricsContainer}>
              <View style={[styles.metricGlassCard, { backgroundColor: 'rgba(155, 242, 232, 0.15)', borderColor: '#9bf2e8', alignItems: 'center', paddingVertical: 32 }]}>
                <Sparkles color="#FFC857" size={48} style={{ marginBottom: 16 }} />
                <Text style={[styles.metricLabelSmall, { color: '#FFC857', fontSize: 24, textAlign: 'center', letterSpacing: 0.5 }]}>Você foi incrível!</Text>
                <Text style={[styles.metricValueSmall, { color: '#FFF', fontSize: 18, marginTop: 12, textAlign: 'center', lineHeight: 26 }]}>
                  Sua sessão foi concluída. Seus reflexos estão super rápidos, parecendo um verdadeiro herói!
                </Text>
              </View>
            </View>
          )}

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
                  <RotateCcw color={pressed ? "#FFF" : "#084D48"} size={24} />
                  <Text style={[styles.playAgainText, pressed && { color: '#FFF' }]}>Jogar Novamente</Text>
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
      </View>
    );
  }

  const progressPercentage = ((currentTrialIndex) / TOTAL_TRIALS) * 100;
  
  // Interpolation for Flame rotation
  const flameRotation = comboWobbleAnim.interpolate({
    inputRange: [-15, 15],
    outputRange: ['-15deg', '15deg']
  });

  return (
    <TouchableWithoutFeedback onPressIn={handleScreenTouch}>
      <View style={styles.gameArea}>
        {renderExitModal()}
        
        {/* HUD Superior (Barra de Progresso) */}
        <View style={styles.topHUD}>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressTextSmall}>Progresso: {currentTrialIndex} / {TOTAL_TRIALS}</Text>
          </View>
        </View>

        {/* HUD do Combo Flutuante Extremo */}
        {comboCount >= 2 && (
          <View style={styles.comboBadge}>
             <Animated.View style={{ transform: [{ rotate: flameRotation }] }}>
               <Flame color="#FFC857" size={32} fill="#FFC857" />
             </Animated.View>
             <Text style={styles.comboText}>{comboCount}x</Text>
          </View>
        )}

        {/* Estímulo (Bolha Animada) */}
        {gameState === 'stimulus' && stimulusData && (
          <Animated.View style={[
             styles.stimulusBubble,
             {
               backgroundColor: stimulusData.color,
               borderColor: stimulusData.shadowColor,
               transform: [
                 { scale: breathingAnim },
                 { scale: popAnim },
                 { translateX: shakeAnim }
               ],
               opacity: popOpacityAnim
             }
          ]}>
             <Text style={styles.emojiGigantic}>{stimulusData.emoji}</Text>
             <Animated.View style={[styles.xOverlay, { opacity: xOpacityAnim }]}>
                <X color="#EF4444" size={140} strokeWidth={5} />
             </Animated.View>
          </Animated.View>
        )}
        
        {/* Botão Voltar (Canto Inferior Esquerdo) */}
        <TouchableOpacity onPress={handleRequestExit} style={styles.backButtonBottomLeft}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
};

const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#084D48',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#084D48',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
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
  backButtonTop: {
    position: 'absolute',
    top: paddingTop,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  menuContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: -1,
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    marginBottom: 40,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9bf2e8',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  stimulusPreview: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewItem: {
    alignItems: 'center',
    gap: 12,
  },
  previewBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  emojiHuge: {
    fontSize: 50,
  },
  previewText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  startButton: {
    backgroundColor: '#FFC857',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    color: '#084D48',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stimulusBubble: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  emojiGigantic: {
    fontSize: 110,
  },
  xOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 110,
  },
  topHUD: {
    position: 'absolute',
    top: paddingTop,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  backButtonBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  progressBarWrapper: {
    flex: 1,
    gap: 8,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9bf2e8',
    borderRadius: 6,
  },
  progressTextSmall: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  comboBadge: {
    position: 'absolute',
    top: paddingTop + 70,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFC857',
    gap: 8,
  },
  comboText: {
    color: '#FFC857',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  resultsContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  finishedTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  metricsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  metricGlassCard: {
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  metricLabelSmall: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricValueSmall: {
    fontSize: 32,
    fontWeight: '900',
  },
  metricDescSmall: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
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
  },
  playAgainText: {
    color: '#084D48',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  gameOverBottomSection: {
    width: '100%',
    gap: 12,
  },
  backHomeButton: {
    paddingVertical: 18,
    borderRadius: 99,
    width: '100%',
    alignItems: 'center',
  },
  backHomeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bottomHUD: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    gap: 8,
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
    borderRadius: 99,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
