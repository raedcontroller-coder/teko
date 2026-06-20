import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
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
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#64748B" size={24} />
          <Text style={styles.backText}>Voltar ao Menu</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Go / No-Go</Text>
        <Text style={styles.instructions}>
          Teste seu controle inibitório!{'\n\n'}
          Toque na tela o mais rápido que puder quando ver o Cachorro.{'\n'}
          NÃO TOQUE na tela quando ver o Gato.
        </Text>
        
        <View style={styles.stimulusPreview}>
          <View style={styles.previewItem}>
            <STIMULI.go.Icon color={STIMULI.go.color} size={64} />
            <Text style={styles.previewText}>TOCAR</Text>
          </View>
          <View style={styles.previewItem}>
            <STIMULI.nogo.Icon color={STIMULI.nogo.color} size={64} />
            <Text style={styles.previewText}>NÃO TOCAR</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Começar Sessão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#64748B" size={24} />
          <Text style={styles.backText}>Voltar ao Menu</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Sessão Concluída</Text>
        
        {metrics && (
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Taxa de Erros de Comissão (TEC)</Text>
              <Text style={[styles.metricValue, { color: '#EF4444' }]}>{metrics.tec}%</Text>
              <Text style={styles.metricDesc}>Toques incorretos no Gato</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Taxa de Omissões (TO)</Text>
              <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{metrics.to}%</Text>
              <Text style={styles.metricDesc}>Faltou tocar no Cachorro</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Tempo de Reação Médio</Text>
              <Text style={[styles.metricValue, { color: '#3B82F6' }]}>{metrics.avgReactionTime} ms</Text>
              <Text style={styles.metricDesc}>Velocidade de acerto</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Jogar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleScreenTouch}>
      <View style={styles.gameArea}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  stimulusPreview: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 48,
  },
  previewItem: {
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#94A3B8',
    fontWeight: '600',
  },
  metricsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  metricCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricDesc: {
    fontSize: 14,
    color: '#94A3B8',
  }
});
