import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform, StatusBar } from 'react-native';
import { ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react-native';
import { PuzzlePiece } from './PuzzlePiece';
import { TelemetryLogger, PuzzleAttempt } from './TelemetryLogger';
import { EdgeType, PieceEdges } from './JigsawPathGenerator';

// A imagem está em apps/mobile/assets/puzzle.png ou .jpg
const PUZZLE_IMAGE = require('../../../assets/puzzle.png'); 
const COLS = 4;
const ROWS = 3;
const TOTAL_PIECES = COLS * ROWS;
const MAX_LEVELS = 10;

const BOARD_WIDTH = 320;
const BOARD_HEIGHT = 320;
const PIECE_W = BOARD_WIDTH / COLS;
const PIECE_H = BOARD_HEIGHT / ROWS;

const screenWidth = Dimensions.get('window').width;
const BOARD_OFFSET_X = (screenWidth - BOARD_WIDTH) / 2;
const BOARD_OFFSET_Y = 220;

const ORIGIN_X_MIN = 10;
const ORIGIN_X_MAX = screenWidth - 100;
const ORIGIN_Y_MIN = 580;
const ORIGIN_Y_MAX = 710;

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
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'level_transition' | 'finished'>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const logger = useMemo(() => new TelemetryLogger(), []);

  const startGame = () => {
    setCurrentLevel(1);
    setPieces(generatePuzzleGrid());
    logger.startSession(TOTAL_PIECES * MAX_LEVELS);
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
          if (currentLevel < MAX_LEVELS) {
            logger.pause();
            setGameState('level_transition');
          } else {
            setMetrics(logger.getMetrics());
            setGameState('finished');
          }
        }, 800);
      }
      return newPieces;
    });
  };

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.menuContent}>
          <View style={styles.imageWrapper}>
            <Image source={PUZZLE_IMAGE} style={styles.previewImage} />
          </View>
          
          <Text style={styles.title}>Quebra-Cabeça</Text>
          
          <View style={styles.glassPanel}>
            <Text style={styles.instructions}>
              A presidente te aguarda.
            </Text>
            <Text style={styles.instructionsDesc}>
              Arraste e solte as peças clássicas para completar a imagem e mostrar suas habilidades visuoespaciais.
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Começar Montagem</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleNextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setPieces(generatePuzzleGrid());
    logger.resume();
    setGameState('playing');
  };

  if (gameState === 'level_transition') {
    return (
      <View style={styles.container}>
        <View style={styles.menuContent}>
          <View style={styles.successIcon}>
            <CheckCircle color="#FFC857" size={64} />
          </View>
          <Text style={styles.title}>Nível {currentLevel} Concluído!</Text>
          
          <View style={styles.glassPanel}>
            <View style={[styles.imageWrapper, { marginBottom: 16 }]}>
              <Image source={PUZZLE_IMAGE} style={[styles.previewImage, { width: 150, height: 150, alignSelf: 'center' }]} />
            </View>
            <Text style={styles.instructionsDesc}>
              Excelente! A imagem foi montada com sucesso. Prepare-se para o nível {currentLevel + 1}.
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleNextLevel} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Avançar para Nível {currentLevel + 1}</Text>
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
          <Text style={styles.finishedTitle}>Montagem Concluída!</Text>
          
          {metrics && (
            <View style={styles.metricsContainer}>
              <View style={styles.metricGlassCard}>
                <Text style={styles.metricLabel}>Índice de Encaixe de Primeira (IEP)</Text>
                <Text style={[styles.metricValue, { color: '#9bf2e8' }]}>{metrics.iep}%</Text>
                <Text style={styles.metricDesc}>{metrics.correctFirstAttempts} de {metrics.totalPieces} peças perfeitas</Text>
              </View>

              <View style={styles.metricRow}>
                <View style={[styles.metricGlassCard, { flex: 1 }]}>
                  <Text style={styles.metricLabelSmall}>Tempo Total</Text>
                  <Text style={[styles.metricValueSmall, { color: '#FFC857' }]}>{metrics.totalTimeSec} s</Text>
                </View>

                <View style={[styles.metricGlassCard, { flex: 1 }]}>
                  <Text style={styles.metricLabelSmall}>Média de Erros</Text>
                  <Text style={[styles.metricValueSmall, { color: '#E5DEFF' }]}>{metrics.mtp}</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.playAgainButton} onPress={startGame} activeOpacity={0.8}>
            <RotateCcw color="#084D48" size={24} />
            <Text style={styles.playAgainText}>Montar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.boardArea}>
      <TouchableOpacity onPress={onBack} style={[styles.backButton, { zIndex: 999 }]}>
        <ArrowLeft color="#fff" size={24} />
      </TouchableOpacity>
      
      <View style={styles.referenceFloating}>
        <Image source={PUZZLE_IMAGE} style={styles.referenceImage} />
        <View style={{ gap: 4 }}>
          <Text style={styles.referenceText}>Referência</Text>
          <Text style={styles.levelCounterText}>Nível {currentLevel} de {MAX_LEVELS}</Text>
        </View>
      </View>
      
      {/* Tabuleiro Glassmorphism */}
      <View 
        style={[
          styles.glassBoard, 
          { 
            left: BOARD_OFFSET_X, 
            top: BOARD_OFFSET_Y, 
            width: BOARD_WIDTH, 
            height: BOARD_HEIGHT 
          }
        ]} 
      />

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

const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#084D48',
  },
  boardArea: {
    flex: 1,
    backgroundColor: '#084D48', // Substituiu o cinza claro
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  menuContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageWrapper: {
    borderRadius: 24,
    padding: 8,
    backgroundColor: 'rgba(255, 246, 227, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 24,
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
  instructions: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9bf2e8',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsDesc: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
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
  glassBoard: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 246, 227, 0.05)',
    borderRadius: 4, // Removido o 16px para não cortar as quinas quadradas das peças
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  referenceFloating: {
    position: 'absolute',
    top: paddingTop,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 246, 227, 0.15)',
    padding: 8,
    paddingRight: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
    gap: 16,
  },
  referenceImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  referenceText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  levelCounterText: {
    fontSize: 14,
    color: '#FFC857',
    fontWeight: 'bold',
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
    padding: 24,
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
  },
  metricValue: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  metricLabelSmall: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricValueSmall: {
    fontSize: 32,
    fontWeight: '900',
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
