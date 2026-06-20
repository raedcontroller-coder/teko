import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { PuzzlePiece } from './PuzzlePiece';
import { TelemetryLogger, PuzzleAttempt } from './TelemetryLogger';
import { EdgeType, PieceEdges } from './JigsawPathGenerator';

// A imagem está em apps/mobile/assets/puzzle.png ou .jpg
const PUZZLE_IMAGE = require('../../../assets/puzzle.png'); 
const COLS = 4;
const ROWS = 3;
const TOTAL_PIECES = COLS * ROWS;

const BOARD_WIDTH = 320;
const BOARD_HEIGHT = 320;
const PIECE_W = BOARD_WIDTH / COLS;
const PIECE_H = BOARD_HEIGHT / ROWS;

const screenWidth = Dimensions.get('window').width;
const BOARD_OFFSET_X = (screenWidth - BOARD_WIDTH) / 2;
const BOARD_OFFSET_Y = 160;

const ORIGIN_X_MIN = 10;
const ORIGIN_X_MAX = screenWidth - 100;
const ORIGIN_Y_MIN = 520;
const ORIGIN_Y_MAX = 650;

interface PieceState {
  id: string;
  col: number;
  row: number;
  edges: PieceEdges;
  targetX: number;
  targetY: number;
  initialX: number;
  initialY: number;
  isPlaced: boolean;
  attemptsCount: number;
}

const generatePuzzleGrid = (): PieceState[] => {
  const verticalEdges: EdgeType[][] = Array.from({ length: ROWS }, () => 
    Array.from({ length: COLS - 1 }, () => (Math.random() > 0.5 ? 1 : -1) as EdgeType)
  );
  const horizontalEdges: EdgeType[][] = Array.from({ length: ROWS - 1 }, () => 
    Array.from({ length: COLS }, () => (Math.random() > 0.5 ? 1 : -1) as EdgeType)
  );

  const pieces: PieceState[] = [];
  const tabSize = Math.min(PIECE_W, PIECE_H) * 0.22;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const edges: PieceEdges = {
        top: r === 0 ? 0 : (-horizontalEdges[r - 1][c] as EdgeType),
        right: c === COLS - 1 ? 0 : verticalEdges[r][c],
        bottom: r === ROWS - 1 ? 0 : horizontalEdges[r][c],
        left: c === 0 ? 0 : (-verticalEdges[r][c - 1] as EdgeType)
      };

      pieces.push({
        id: `p_${r}_${c}`,
        col: c,
        row: r,
        edges,
        targetX: BOARD_OFFSET_X + c * PIECE_W - tabSize,
        targetY: BOARD_OFFSET_Y + r * PIECE_H - tabSize,
        initialX: ORIGIN_X_MIN + Math.random() * (ORIGIN_X_MAX - ORIGIN_X_MIN),
        initialY: ORIGIN_Y_MIN + Math.random() * (ORIGIN_Y_MAX - ORIGIN_Y_MIN),
        isPlaced: false,
        attemptsCount: 0
      });
    }
  }

  return pieces.sort(() => Math.random() - 0.5);
};

interface PuzzleGameProps {
  onBack: () => void;
}

export const PuzzleGame: React.FC<PuzzleGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const logger = useMemo(() => new TelemetryLogger(), []);

  const startGame = () => {
    setPieces(generatePuzzleGrid());
    logger.startSession(TOTAL_PIECES);
    setGameState('playing');
    setMetrics(null);
  };

  const handleAttempt = (id: string, isCorrect: boolean, distance: number) => {
    setPieces(prev => {
      const newPieces = [...prev];
      const idx = newPieces.findIndex(p => p.id === id);
      if (idx !== -1) {
        const piece = newPieces[idx];
        const isFirstAttempt = piece.attemptsCount === 0;
        
        logger.logAttempt({
          pieceId: id,
          isCorrect,
          isFirstAttempt,
          distance
        });

        piece.attemptsCount += 1;
        if (isCorrect) piece.isPlaced = true;
      }
      
      if (newPieces.every(p => p.isPlaced)) {
        setTimeout(() => {
          setMetrics(logger.getMetrics());
          setGameState('finished');
        }, 800);
      }
      return newPieces;
    });
  };

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#64748B" size={24} />
          <Text style={styles.backText}>Voltar ao Menu</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quebra-Cabeça</Text>
        <Text style={styles.instructions}>
          A presidente te aguarda.{'\n'}
          Arraste e solte as peças clássicas para completar a imagem.
        </Text>
        <Image source={PUZZLE_IMAGE} style={styles.previewImage} />
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Começar Montagem</Text>
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
        
        <Text style={styles.title}>Montagem Concluída!</Text>
        
        {metrics && (
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Índice de Encaixe de Primeira (IEP)</Text>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>{metrics.iep}%</Text>
              <Text style={styles.metricDesc}>{metrics.correctFirstAttempts} de {metrics.totalPieces} peças perfeitas</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Tempo Total de Conclusão (TTC)</Text>
              <Text style={[styles.metricValue, { color: '#3B82F6' }]}>{metrics.totalTimeSec} s</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Média de Tentativas</Text>
              <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{metrics.mtp} / peça</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Montar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.boardArea}>
      <TouchableOpacity onPress={onBack} style={[styles.backButton, { zIndex: 999 }]}>
        <ArrowLeft color="#64748B" size={24} />
      </TouchableOpacity>
      
      <View style={styles.referenceContainer}>
        <Text style={styles.referenceText}>Referência:</Text>
        <Image source={PUZZLE_IMAGE} style={styles.referenceImage} />
      </View>
      
      <View style={[styles.boardOutline, { left: BOARD_OFFSET_X, top: BOARD_OFFSET_Y, width: BOARD_WIDTH, height: BOARD_HEIGHT }]} />

      {pieces.map(p => (
        <PuzzlePiece
          key={p.id}
          id={p.id}
          w={PIECE_W}
          h={PIECE_H}
          edges={p.edges}
          col={p.col}
          row={p.row}
          imageSource={PUZZLE_IMAGE}
          fullImageWidth={BOARD_WIDTH}
          fullImageHeight={BOARD_HEIGHT}
          initialX={p.initialX}
          initialY={p.initialY}
          targetX={p.targetX}
          targetY={p.targetY}
          boardX={BOARD_OFFSET_X}
          boardY={BOARD_OFFSET_Y}
          boardW={BOARD_WIDTH}
          boardH={BOARD_HEIGHT}
          isPlaced={p.isPlaced}
          onAttempt={handleAttempt}
        />
      ))}
    </View>
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
  boardArea: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  previewImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 40,
    resizeMode: 'cover'
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
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  boardOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  referenceContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10,
  },
  referenceText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  referenceImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    resizeMode: 'cover'
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
