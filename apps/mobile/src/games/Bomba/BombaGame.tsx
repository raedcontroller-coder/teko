import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Mic, ArrowLeft } from 'lucide-react-native';
import { BombTimer } from '../../components/BombTimer';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { getRandomCategory, GameCategory } from '../../data/categories';

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
  const [tickSpeed, setTickSpeed] = useState(100); // quantos ms subtrair a cada 100ms
  const [gameOver, setGameOver] = useState(false);
  
  const { isRecording, isValidating, startRecording, stopRecordingAndValidate } = useAudioRecorder();

  // Iniciar Jogo
  const startGame = () => {
    setCategory(getRandomCategory());
    setCurrentPlayer('Psicólogo');
    setTimeLeft(INITIAL_TIME);
    setTickSpeed(100);
    setGameOver(false);
    setIsPlaying(true);
  };

  // Loop do Timer
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

  const handleRecordPress = async () => {
    if (!category) return;

    if (!isRecording) {
      await startRecording();
    } else {
      const response = await stopRecordingAndValidate(category.name);
      
      if (response) {
        if (response.valid) {
          // ACERTO
          // Aumenta o tempo restante (bônus)
          setTimeLeft((prev) => prev + 5000); // +5 segundos
          // Mas acelera o relógio para descarregar mais rápido!
          setTickSpeed((prev) => prev * 1.25); 
          
          // Passa a vez
          setCurrentPlayer((prev) => (prev === 'Psicólogo' ? 'Criança' : 'Psicólogo'));
        } else {
          // ERRO (NEGATIVO)
          Alert.alert("Inválido!", `A palavra ouvida foi "${response.transcription}", que não pertence à categoria "${category.name}". Tente novamente!`);
          // Penaliza levemente o tempo ou apenas não dá bônus
        }
      }
    }
  };

  if (!isPlaying && !gameOver) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#64748B" size={24} />
          <Text style={styles.backText}>Voltar ao Menu</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Jogo da Bomba</Text>
        <Text style={styles.instructions}>
          Falem palavras da categoria sorteada alternadamente.{'\n'}
          Se errar, a mesma pessoa tenta de novo!
        </Text>
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Começar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#64748B" size={24} />
          <Text style={styles.backText}>Voltar ao Menu</Text>
        </TouchableOpacity>
        <Text style={styles.boomText}>KABOOM!</Text>
        <Text style={styles.loserText}>A bomba estourou na vez de: {currentPlayer}</Text>
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Jogar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft color="#64748B" size={24} />
        <Text style={styles.backText}>Voltar ao Menu</Text>
      </TouchableOpacity>
      <Text style={styles.turnText}>Vez: {currentPlayer}</Text>
      <Text style={styles.categoryText}>Categoria: {category?.name}</Text>
      
      <BombTimer timeLeft={timeLeft} totalTime={INITIAL_TIME} />

      <View style={styles.controls}>
        {isValidating ? (
          <Text style={styles.validatingText}>Analisando áudio...</Text>
        ) : (
          <TouchableOpacity 
            style={[styles.micButton, isRecording && styles.micRecording]} 
            onPress={handleRecordPress}
          >
            <Mic color="#FFF" size={32} />
            <Text style={styles.micText}>
              {isRecording ? "Parar e Validar" : "Segure ou Toque para Falar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  boomText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 10,
  },
  loserText: {
    fontSize: 20,
    marginBottom: 30,
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2563EB',
    marginBottom: 30,
  },
  controls: {
    marginTop: 40,
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#4B5563',
    padding: 20,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  micRecording: {
    backgroundColor: '#DC2626',
  },
  micText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  validatingText: {
    fontSize: 18,
    color: '#D97706',
    fontWeight: 'bold',
  },
});
