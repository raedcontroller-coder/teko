import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Platform, StatusBar } from 'react-native';
import { ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react-native';
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

  const logger = useMemo(() => new TelemetryLogger(), []);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onsetTimeRef = useRef<number>(0);
  const isResponseLogged = useRef<boolean>(false);

  const startGame = () => {
    logger.clear();
    setSequence(generateSequence());
    setCurrentTrialIndex(0);
    setGameState('isi');
    setMetrics(null);
  };

  const currentStimulusType = sequence[currentTrialIndex];
  const stimulusData = currentStimulusType ? STIMULI[currentStimulusType] : null;

  const nextTrial = () => {
    if (currentTrialIndex + 1 >= sequence.length) {
      setGameState('finished');
      setMetrics(logger.getMetrics());
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
      const isiDuration = Math.random() * 1000 + 500; // 500ms to 1500ms
      timeoutRef.current = setTimeout(() => {
        setGameState('stimulus');
      }, isiDuration);
    } else if (gameState === 'stimulus') {
      onsetTimeRef.current = performance.now();
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
      const responseType: ResponseType = currentStimulusType === 'go' ? 'hit' : 'commission';
      
      logger.logEvent({
        stimulusType: currentStimulusType,
        stimulusOnset: onsetTimeRef.current,
        responseTimestamp: touchTime,
        responseType,
        reactionTime,
      });
      
      // Advance immediately upon touch
      nextTrial();
    }
  };

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonTop}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.menuContent}>
          <Text style={styles.title}>Go / No-Go</Text>
          
          <View style={styles.glassPanel}>
            <Text style={styles.instructionsTitle}>Teste seu controle inibitório!</Text>
            <Text style={styles.instructionsDesc}>
              Toque na tela o mais rápido que puder quando ver o Cachorro.{'\n\n'}
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>NÃO TOQUE</Text> na tela quando ver o Gato.
            </Text>

            <View style={styles.stimulusPreview}>
              <View style={styles.previewItem}>
                <STIMULI.go.Icon color="#9bf2e8" size={64} />
                <Text style={styles.previewText}>TOCAR</Text>
              </View>
              <View style={styles.previewItem}>
                <STIMULI.nogo.Icon color="#EF4444" size={64} />
                <Text style={styles.previewText}>NÃO TOCAR</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Começar Sessão</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
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
              <View style={styles.metricGlassCard}>
                <Text style={styles.metricLabel}>Taxa de Erros de Comissão (TEC)</Text>
                <Text style={[styles.metricValue, { color: '#EF4444' }]}>{metrics.tec}%</Text>
                <Text style={styles.metricDesc}>Toques incorretos no Gato</Text>
              </View>

              <View style={styles.metricRow}>
                <View style={[styles.metricGlassCard, { flex: 1 }]}>
                  <Text style={styles.metricLabelSmall}>Omissões (TO)</Text>
                  <Text style={[styles.metricValueSmall, { color: '#FFC857' }]}>{metrics.to}%</Text>
                  <Text style={styles.metricDescSmall}>Perdeu o cão</Text>
                </View>

                <View style={[styles.metricGlassCard, { flex: 1 }]}>
                  <Text style={styles.metricLabelSmall}>Reação (Média)</Text>
                  <Text style={[styles.metricValueSmall, { color: '#9bf2e8' }]}>{metrics.avgReactionTime}ms</Text>
                  <Text style={styles.metricDescSmall}>Velocidade</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.playAgainButton} onPress={startGame} activeOpacity={0.8}>
            <RotateCcw color="#084D48" size={24} />
            <Text style={styles.playAgainText}>Jogar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleScreenTouch}>
      <View style={styles.gameArea}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonGame}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

        {gameState === 'stimulus' && stimulusData && (
          <View style={styles.stimulusWrapper}>
            <stimulusData.Icon color={stimulusData.color} size={160} />
          </View>
        )}
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{currentTrialIndex + 1} / {TOTAL_TRIALS}</Text>
        </View>
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
  backButtonGame: {
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
    gap: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewItem: {
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  startButton: {
    backgroundColor: '#E6A800',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
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
  stimulusWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 40,
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
    letterSpacing: 2,
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
});
