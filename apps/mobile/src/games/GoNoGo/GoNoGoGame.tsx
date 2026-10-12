import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Platform, StatusBar, Pressable, Animated, Modal, Vibration, ScrollView, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { ArrowLeft, CheckCircle, RotateCcw, Flame, X, Frown, Play, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import { STIMULI, StimulusType } from './data';
import { TelemetryLogger, ResponseType } from './TelemetryLogger';
import { api, API_TWO_URL } from '../../services/api';
import { useTranslation } from '../../i18n';

const BACKGROUND_IMAGE = require('../../../assets/assets_tocarapido/fundo_toca_rapido.png');

interface GoNoGoGameProps {
  alunoId: string;
  onBack: () => void;
}

type GameState = 'menu' | 'isi' | 'stimulus' | 'finished';

const TOTAL_TRIALS = 100;
const GO_RATIO = 0.8; // 80 Go, 20 No-Go

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

export const GoNoGoGame: React.FC<GoNoGoGameProps> = ({ alunoId, onBack }) => {
  const { t } = useTranslation();
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
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound: correctSound } = await Audio.Sound.createAsync(
          require('../../../assets/click_correto_gonogo.mp3'),
          { shouldPlay: false, volume: 1.0 }
        );
        const { sound: incorrectSound } = await Audio.Sound.createAsync(
          require('../../../assets/click_incorreto_gonogo.mp3'),
          { shouldPlay: false, volume: 1.0 }
        );
        
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
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
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

  const [isSavingSession, setIsSavingSession] = useState(false);
  const savePromiseRef = useRef<Promise<any> | null>(null);
  const hasSavedRef = useRef<boolean>(false);

  const saveSession = (rawMetrics: any) => {
    if (hasSavedRef.current || savePromiseRef.current) {
      return savePromiseRef.current;
    }

    setIsSavingSession(true);

    const promise = (async () => {
      try {
        // Envia os dados puros para o Python calcular o d' e Critério C (SDT)
        (async () => {
          try {
            const apiUrlSDT = `${API_TWO_URL}/api/gonogo/sdt`;
            const response = await fetch(apiUrlSDT, {
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
            console.log("Erro ao chamar API de SDT:", e);
          }
        })();

        // Envia os dados para a API de cálculo psicométrico de Impulsividade (Erro_NoGo)
        const apiUrlImpulsividade = `${API_TWO_URL}/api/calculo/tocarapido`;
        let result: any = null;
        try {
          const response = await fetch(apiUrlImpulsividade, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawMetrics)
          });
          result = await response.json();
          console.log('Impulsividade Python API Success:', result);
        } catch (pyErr) {
          console.log("Failed to send Toca Rápido telemetry to Python:", pyErr);
        }

        const behaviorData = {
          ...(result || {}),
          erro_nogo: result?.erro_nogo ?? rawMetrics.falseAlarms ?? 0,
          failure_rate_pct: result?.failure_rate_pct ?? (rawMetrics.totalNoGoStimuli > 0 ? ((rawMetrics.falseAlarms ?? 0) / rawMetrics.totalNoGoStimuli * 100) : 0),
          total_nogo: result?.total_nogo ?? rawMetrics.totalNoGoStimuli ?? 0,
          acertos_go: rawMetrics.hits ?? rawMetrics.reactionTimesHits?.length ?? 0
        };

        const res = await api.post('/api/sessions', {
          alunoId,
          gameName: 'GoNoGo',
          behaviorData
        });
        hasSavedRef.current = true;
        console.log("✅ Sessão GoNoGo salva no banco de dados com sucesso!", res?.data);
        return res?.data;
      } catch (err) {
        console.log("❌ Erro ao salvar sessão GoNoGo no banco de dados:", err);
      } finally {
        setIsSavingSession(false);
      }
    })();

    savePromiseRef.current = promise;
    return promise;
  };

  const startGame = async () => {
    // Se a sessão anterior acabou de finalizar e ainda estiver salvando, aguarda a persistência
    if (savePromiseRef.current) {
      try {
        await savePromiseRef.current;
      } catch (_) {}
    }
    savePromiseRef.current = null;
    hasSavedRef.current = false;
    setIsSavingSession(false);

    logger.clear();
    setSequence(generateSequence());
    setCurrentTrialIndex(0);
    setGameState('isi');
    setMetrics(null);
    setComboCount(0);
  };

  const handleFinishExit = async () => {
    if (savePromiseRef.current) {
      try {
        await savePromiseRef.current;
      } catch (_) {}
    }
    onBack();
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
    <Modal 
      visible={showExitModal} 
      transparent 
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancelExit}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.menuBox}>
          <TouchableOpacity style={styles.closeModalButton} onPress={cancelExit}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>

          <View style={styles.frownIconWrapper}>
            <Frown color="#FFC857" size={48} />
          </View>

          <Text style={styles.exitModalTitle}>{t.gameGoNoGo.exitTitle}</Text>
          <Text style={styles.exitModalText}>
            {t.gameGoNoGo.exitText}
          </Text>

          <View style={styles.exitModalButtons}>
            <Pressable 
              onPress={cancelExit}
              style={({ pressed }) => [styles.stayButton, pressed && { backgroundColor: '#7B61FF' }]}
            >
              {({ pressed }) => (
                <Text style={[styles.stayButtonText, pressed && { color: '#FFF' }]}>{t.gameGoNoGo.stayButton}</Text>
              )}
            </Pressable>

            <TouchableOpacity style={styles.leaveButton} onPress={confirmExit}>
              <Text style={styles.leaveButtonText}>{t.gameGoNoGo.leaveButton}</Text>
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
      saveSession(rawMetrics);
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
        try {
          if (soundsRef.current.correct) {
            soundsRef.current.correct.setPositionAsync(0).then(() => soundsRef.current.correct?.playAsync()).catch(() => {});
          }
        } catch (_) {}
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
        setComboCount(prev => prev + 1);
        
        // Efeito de Estouro (Pop Out)
        Animated.parallel([
          Animated.timing(popAnim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
          Animated.timing(popOpacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();

      } else {
        try {
          if (soundsRef.current.incorrect) {
            soundsRef.current.incorrect.setPositionAsync(0).then(() => soundsRef.current.incorrect?.playAsync()).catch(() => {});
          }
        } catch (_) {}
        try { 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Vibration.vibrate(300); 
        } catch (_) {}
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
      <ImageBackground source={BACKGROUND_IMAGE} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.darkOverlay}>
          {renderExitModal()}
          <TouchableOpacity onPress={handleRequestExit} style={styles.backButtonTop}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          
          <ScrollView 
            contentContainerStyle={styles.menuScrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.menuContent}>
              <View style={styles.glassPanel}>
                <Text style={styles.title}>{t.gameGoNoGo.title}</Text>
                <Text style={styles.instructionsTitle}>{t.gameGoNoGo.subtitle}</Text>
                <Text style={styles.instructionsDesc}>
                  {t.gameGoNoGo.instructions}
                </Text>

                <View style={styles.stimulusPreview}>
                  <View style={styles.previewItem}>
                    <View style={styles.previewBubble}>
                      <Image source={STIMULI.go.image} style={styles.previewImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.previewText}>{t.gameGoNoGo.touch}</Text>
                  </View>
                  <View style={styles.previewItem}>
                    <View style={styles.previewBubble}>
                      <Image source={STIMULI.nogo.image} style={styles.previewImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.previewText}>{t.gameGoNoGo.statue}</Text>
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
                      <Play color={pressed ? "#FFF" : "#084D48"} size={26} fill={pressed ? "#FFF" : "#084D48"} />
                      <Text style={[styles.startButtonText, pressed && { color: '#FFF' }]}>{t.gameGoNoGo.play}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  if (gameState === 'finished') {
    return (
      <ImageBackground source={BACKGROUND_IMAGE} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.darkOverlay}>
          {renderExitModal()}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleFinishExit} style={styles.iconButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.gameGoNoGo.results}</Text>
            <View style={{ width: 44 }} />
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.resultsScrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.resultsContent}>
              <View style={styles.successIcon}>
                <CheckCircle color="#9bf2e8" size={42} />
              </View>
              <Text style={styles.finishedTitle}>{t.gameGoNoGo.sessionCompleted}</Text>
              
              {metrics && (
                <View style={styles.metricsContainer}>
                  <View style={styles.metricGlassCard}>
                    <Sparkles color="#FFC857" size={24} style={{ marginBottom: 4 }} />
                    <Text style={styles.metricLabelSmall}>{t.gameGoNoGo.feedbackMessage}</Text>
                  </View>
                </View>
              )}

              <View style={styles.gameOverBottomSection}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.playAgainButton,
                    pressed && { backgroundColor: '#7B61FF' },
                    isSavingSession && { opacity: 0.8 }
                  ]} 
                  onPress={startGame}
                >
                  {({ pressed }) => (
                    <>
                      {isSavingSession ? (
                        <ActivityIndicator color={pressed ? "#FFF" : "#084D48"} size="small" />
                      ) : (
                        <RotateCcw color={pressed ? "#FFF" : "#084D48"} size={22} />
                      )}
                      <Text style={[styles.playAgainText, pressed && { color: '#FFF' }]}>
                        {isSavingSession ? 'Salvando dados...' : t.gameGoNoGo.playAgain}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.backHomeButton,
                    pressed && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  ]} 
                  onPress={handleFinishExit}
                >
                  {({ pressed }) => (
                    <Text style={[styles.backHomeText, pressed && { color: '#FFF' }]}>{t.gameGoNoGo.backHome}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  const progressPercentage = ((currentTrialIndex) / TOTAL_TRIALS) * 100;
  
  // Interpolation for Flame rotation
  const flameRotation = comboWobbleAnim.interpolate({
    inputRange: [-15, 15],
    outputRange: ['-15deg', '15deg']
  });

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.backgroundImage} resizeMode="cover">
      <Pressable 
        style={styles.gameArea} 
        onPressIn={handleScreenTouch}
      >
        {renderExitModal()}
        
        {/* HUD Superior (Barra de Progresso 100% Centralizada) */}
        <View style={styles.topHUD} pointerEvents="none">
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressTextSmall}>{t.gameGoNoGo.progress.replace('{{current}}', currentTrialIndex.toString()).replace('{{total}}', TOTAL_TRIALS.toString())}</Text>
          </View>
        </View>

        {/* Botão Voltar no Canto Inferior Esquerdo da Tela */}
        <TouchableOpacity 
          onPress={handleRequestExit} 
          style={styles.bottomBackButton}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

        {/* HUD do Combo Flutuante Extremo */}
        {comboCount >= 2 && (
          <View style={styles.comboBadge} pointerEvents="none">
             <Animated.View style={{ transform: [{ rotate: flameRotation }] }}>
               <Flame color="#FFC857" size={26} fill="#FFC857" />
             </Animated.View>
             <Text style={styles.comboText}>{comboCount}x</Text>
          </View>
        )}

        {/* Estímulo (Bolha Ilustrada Animada) */}
        {gameState === 'stimulus' && stimulusData && (
          <Animated.View 
            pointerEvents="none"
            style={[
              styles.stimulusBubble,
              {
                transform: [
                  { scale: breathingAnim },
                  { scale: popAnim },
                  { translateX: shakeAnim }
                ],
                opacity: popOpacityAnim
              }
            ]}
          >
             <Image 
               source={stimulusData.image} 
               style={styles.stimulusImage} 
               resizeMode="contain" 
             />
             <Animated.View style={[styles.xOverlay, { opacity: xOpacityAnim }]}>
                <X color="#EF4444" size={130} strokeWidth={6} />
             </Animated.View>
          </Animated.View>
        )}
      </Pressable>
    </ImageBackground>
  );
};

const paddingTop = Platform.OS === 'android' ? 14 : 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#084D48',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 50, 46, 0.65)',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: paddingTop,
    paddingBottom: 10,
    zIndex: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  iconButton: {
    width: 40,
    height: 40,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 20,
  },
  hudBackButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  menuScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuContent: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  glassPanel: {
    backgroundColor: 'rgba(28, 33, 40, 0.72)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC857',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructionsDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    maxWidth: 580,
    fontWeight: '500',
  },
  stimulusPreview: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  previewItem: {
    alignItems: 'center',
    gap: 8,
  },
  previewBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 24, 30, 0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
    padding: 6,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: '#FFC857',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 99,
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    color: '#084D48',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stimulusBubble: {
    width: 230,
    height: 230,
    borderRadius: 115,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 24, 30, 0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    padding: 12,
    position: 'relative',
  },
  stimulusImage: {
    width: '100%',
    height: '100%',
  },
  xOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 100,
  },
  topHUD: {
    position: 'absolute',
    top: paddingTop,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  bottomBackButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 90,
  },
  progressBarWrapper: {
    width: '100%',
    gap: 4,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9bf2e8',
    borderRadius: 5,
  },
  progressTextSmall: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  comboBadge: {
    position: 'absolute',
    top: paddingTop + 44,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFC857',
    gap: 6,
    zIndex: 15,
  },
  comboText: {
    color: '#FFC857',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  resultsScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resultsContent: {
    width: '100%',
    maxWidth: 540,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 6,
  },
  finishedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  metricsContainer: {
    width: '100%',
    marginBottom: 12,
  },
  metricGlassCard: {
    backgroundColor: 'rgba(28, 33, 40, 0.72)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  metricLabelSmall: {
    fontSize: 16,
    color: '#FFC857',
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  playAgainButton: {
    backgroundColor: '#FFC857',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 99,
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playAgainText: {
    color: '#084D48',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  gameOverBottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  backHomeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 99,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  backHomeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    zIndex: 10,
  },
  frownIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.3)',
  },
  exitModalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  exitModalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 480,
  },
  exitModalButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  stayButton: {
    backgroundColor: '#FFC857',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayButtonText: {
    color: '#084D48',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leaveButton: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

