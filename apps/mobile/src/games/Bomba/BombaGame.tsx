import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, Animated } from 'react-native';
import { Mic, ArrowLeft, Settings, Bomb, Play } from 'lucide-react-native';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { getRandomCategory, GameCategory } from '../../data/categories';
import Svg, { Path, Circle, G, Line, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

type Player = 'Psicólogo' | 'Criança';

interface BombaGameProps {
  onBack: () => void;
}

export const BombaGame: React.FC<BombaGameProps> = ({ onBack }) => {
  const [category, setCategory] = useState<GameCategory | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('Psicólogo');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Temporizador
  const INITIAL_TIME = 15000;
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [tickSpeed, setTickSpeed] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  
  // Animações
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerScaleAnim = useRef(new Animated.Value(1)).current;
  
  const { isRecording, isValidating, startRecording, stopRecordingAndValidate } = useAudioRecorder();

  const startGame = () => {
    setCategory(getRandomCategory());
    setCurrentPlayer('Psicólogo');
    setTimeLeft(INITIAL_TIME);
    setTickSpeed(100);
    setGameOver(false);
    setIsPlaying(true);
    
    shakeAnim.setValue(0);
    pulseAnim.setValue(1);
    timerScaleAnim.setValue(1);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && !gameOver && !isValidating) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - tickSpeed;
          if (next <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, isValidating, tickSpeed]);

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

  const handleRecordPressIn = async () => {
    if (!category || isValidating) return;
    await startRecording();
  };

  const handleRecordPressOut = async () => {
    if (!category || isValidating || !isRecording) return;
    const response = await stopRecordingAndValidate(category.name);
    
    if (response) {
      if (response.valid) {
        setTimeLeft((prev) => prev + 5000);
        setTickSpeed((prev) => prev * 1.25);
        setCurrentPlayer((prev) => (prev === 'Psicólogo' ? 'Criança' : 'Psicólogo'));
      } else {
        Alert.alert("Inválido!", `A palavra ouvida foi "${response.transcription}", que não pertence à categoria "${category.name}". Tente novamente!`);
      }
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
  const secs = Math.ceil(timeLeft / 1000).toString().padStart(2, '0');

  if (!isPlaying && !gameOver) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.menuContent}>
          <View style={styles.iconWrapper}>
            <Bomb color="#E6A800" size={64} />
          </View>
          <Text style={styles.title}>Jogo da Bomba</Text>
          
          <View style={styles.glassPanel}>
            <Text style={styles.instructions}>
              Pressione e segure o microfone para falar palavras da categoria sorteada. A vez alterna a cada acerto!
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Começar a Jogar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.gameOverTitle}>Fim de Jogo</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.kaboomCenter}>
          <Text style={styles.kaboomText}>KABOOM!</Text>
          
          <View style={[styles.glassPanel, styles.feedbackCard]}>
            <Text style={styles.feedbackTitle}>A bomba estourou com o(a) {currentPlayer}!</Text>
            <Text style={styles.feedbackDesc}>O tempo acabou bem na hora do turno dele(a).</Text>
          </View>
        </View>

        <View style={styles.gameOverBottomSection}>
          <TouchableOpacity style={styles.playAgainButton} onPress={startGame} activeOpacity={0.8}>
            <Play color="#084D48" size={24} fill="#084D48" />
            <Text style={styles.playAgainText}>Jogar Novamente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backHomeButton} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backHomeText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Segura */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: timerScaleAnim }] }]}>
          <Text style={[styles.timerText, isTense && styles.timerTextDanger]}>
            00:{secs}
          </Text>
          <Text style={styles.timerLabel}>Tempo Restante</Text>
        </Animated.View>

        <TouchableOpacity style={styles.iconButton}>
          <Settings color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Cards de Categoria e Turno */}
      <View style={styles.topSection}>
        <View style={styles.glassPanel}>
          <Text style={styles.categoryLabel}>Categoria Semântica</Text>
          <Text style={styles.categoryValue}>{category?.name}</Text>
        </View>
        <View style={styles.turnBadge}>
          <View style={styles.turnIndicator} />
          <Text style={styles.turnText}>Vez do(a) {currentPlayer}</Text>
        </View>
      </View>

      {/* Jogo: SVG Bomb */}
      <View style={styles.stage}>
        <Animated.View style={[styles.bombWrapper, { transform: [{ translateX: shakeAnim }] }]}>
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
          <View style={[styles.glassPanel, styles.statusChip]}>
            <Text style={styles.statusText}>Processando fala...</Text>
          </View>
        ) : (
          <View style={{ height: 44 }} /> // Placeholder to avoid jumping UI
        )}

        <TouchableOpacity 
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPressIn={handleRecordPressIn}
          onPressOut={handleRecordPressOut}
          activeOpacity={0.8}
        >
          <Mic color={isRecording ? "#FFF" : "#084D48"} size={48} />
        </TouchableOpacity>
        
        <Text style={styles.micInstruction}>
          {isRecording ? 'Solte para validar' : 'Pressione e segure para falar'}
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
  glassPanel: {
    backgroundColor: 'rgba(255, 246, 227, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
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
    fontSize: 36,
    fontWeight: '800',
    color: '#E6A800',
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
  statusChip: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: 'auto',
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6A800',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E6A800',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  micButtonRecording: {
    backgroundColor: '#5b3cdd',
    shadowColor: '#5b3cdd',
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
    backgroundColor: 'rgba(230, 168, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(230, 168, 0, 0.3)',
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
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#E6A800',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 40,
    shadowColor: '#E6A800',
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
    color: '#E6A800', // yellow to match aesthetic
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
  kaboomText: {
    fontSize: 64,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFC857',
    textAlign: 'center',
    letterSpacing: -2,
    textShadowColor: 'rgba(255, 200, 87, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
    marginBottom: 40,
  },
  feedbackCard: {
    padding: 24,
    width: '100%',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
});
