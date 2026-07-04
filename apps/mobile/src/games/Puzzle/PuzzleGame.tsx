import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform, StatusBar, ActivityIndicator, Pressable, Modal } from 'react-native';
import { Audio } from 'expo-av';
import { ArrowLeft, CheckCircle, RotateCcw, Frown, X } from 'lucide-react-native';
import { PuzzlePiece } from './PuzzlePiece';
import { TelemetryLogger, PuzzleAttempt } from './TelemetryLogger';
import { EdgeType, PieceEdges } from './JigsawPathGenerator';

const PUZZLE_IMAGES: Record<number, any> = {
  1: require('../../../assets/img_quebracabeca/puzzle1.png'),
  2: require('../../../assets/img_quebracabeca/puzzle2.png'),
  3: require('../../../assets/img_quebracabeca/puzzle3.png'),
  4: require('../../../assets/img_quebracabeca/puzzle4.png'),
  5: require('../../../assets/img_quebracabeca/puzzle5.png'),
  6: require('../../../assets/img_quebracabeca/puzzle6.png'),
  7: require('../../../assets/img_quebracabeca/puzzle7.png'),
  8: require('../../../assets/img_quebracabeca/puzzle8.png'),
  9: require('../../../assets/img_quebracabeca/puzzle9.png'),
  10: require('../../../assets/img_quebracabeca/puzzle10.png'),
};
const ENCAIXE_SOUND = require('../../../assets/encaixe-peca.mp3');
const ERRO_SOUND = require('../../../assets/erro.mp3');
const PROXIMO_SOUND = require('../../../assets/proximo-nivel.mp3');
const VITORIA_SOUND = require('../../../assets/venceu-jogo.mp3');
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
  const [gameState, setGameState] = useState<'loading_sounds' | 'menu' | 'playing' | 'level_transition' | 'finished'>('loading_sounds');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showExpandedReference, setShowExpandedReference] = useState(false);
  const logger = useMemo(() => new TelemetryLogger(), []);

  const currentImage = PUZZLE_IMAGES[currentLevel] || PUZZLE_IMAGES[1];

  const [sounds, setSounds] = useState<{
    encaixe: Audio.Sound | null;
    erro: Audio.Sound | null;
    proximo: Audio.Sound | null;
    vitoria: Audio.Sound | null;
  }>({ encaixe: null, erro: null, proximo: null, vitoria: null });

  useEffect(() => {
    let isMounted = true;
    let s1: Audio.Sound;
    let s2: Audio.Sound;
    let s3: Audio.Sound;
    let s4: Audio.Sound;

    const loadSounds = async () => {
      try {
        const { sound: encaixeSound } = await Audio.Sound.createAsync(ENCAIXE_SOUND, { volume: 0.5 });
        const { sound: erroSound } = await Audio.Sound.createAsync(ERRO_SOUND, { volume: 0.5 });
        const { sound: proximoSound } = await Audio.Sound.createAsync(PROXIMO_SOUND, { volume: 0.5 });
        const { sound: vitoriaSound } = await Audio.Sound.createAsync(VITORIA_SOUND, { volume: 0.5 });
        
        s1 = encaixeSound;
        s2 = erroSound;
        s3 = proximoSound;
        s4 = vitoriaSound;

        if (isMounted) {
          setSounds({ encaixe: s1, erro: s2, proximo: s3, vitoria: s4 });
          setGameState('menu');
        }
      } catch (e) {
        console.error("Erro ao carregar sons", e);
        if (isMounted) setGameState('menu');
      }
    };

    loadSounds();

    return () => {
      isMounted = false;
      s1?.unloadAsync();
      s2?.unloadAsync();
      s3?.unloadAsync();
      s4?.unloadAsync();
    };
  }, []);

  const startGame = () => {
    setCurrentLevel(1);
    setPieces(generatePuzzleGrid());
    logger.startSession(TOTAL_PIECES * MAX_LEVELS);
    setGameState('playing');
    setMetrics(null);
  };

  const handleRequestExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    onBack();
  };

  const cancelExit = () => {
    setShowExitModal(false);
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
            Você já vai embora?{'\n'}O quebra-cabeça estava ficando tão bonito!
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
        if (isCorrect) {
          piece.isPlaced = true;
          sounds.encaixe?.replayAsync();
        } else {
          sounds.erro?.replayAsync();
        }
      }
      
      if (newPieces.every(p => p.isPlaced)) {
        setTimeout(() => {
          if (currentLevel < MAX_LEVELS) {
            sounds.proximo?.replayAsync();
            logger.pause();
            setGameState('level_transition');
          } else {
            sounds.vitoria?.replayAsync();
            setMetrics(logger.getMetrics());
            setGameState('finished');
          }
        }, 800);
      }
      return newPieces;
    });
  };

  if (gameState === 'loading_sounds') {
    return (
      <View style={styles.container}>
        <View style={styles.menuContent}>
          <ActivityIndicator size="large" color="#FFC857" />
          <Text style={[styles.title, { marginTop: 24, fontSize: 20 }]}>Preparando o Jogo...</Text>
        </View>
        {renderExitModal()}
      </View>
    );
  }

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleRequestExit} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.menuContent}>
          <View style={styles.imageWrapper}>
            <Image source={currentImage} style={styles.previewImage} />
          </View>
          
          <Text style={styles.title}>Quebra-Cabeça</Text>
          
          <View style={styles.glassPanel}>
            <Text style={styles.instructionsDesc}>
              Olhe a imagem acima e junte as pecinhas para montar o desenho. Você consegue!
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
              <Text style={[styles.startButtonText, pressed && { color: '#FFF' }]}>Começar Montagem</Text>
            )}
          </Pressable>
        </View>
        {renderExitModal()}
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
              <Image source={PUZZLE_IMAGES[currentLevel + 1] || PUZZLE_IMAGES[1]} style={[styles.previewImage, { width: 250, height: 250, alignSelf: 'center' }]} />
            </View>
            <Text style={styles.instructionsDesc}>
              Excelente! A imagem foi montada com sucesso. Prepare-se para o nível {currentLevel + 1}.
            </Text>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.startButton,
              pressed && { backgroundColor: '#7B61FF' }
            ]} 
            onPress={handleNextLevel}
          >
            {({ pressed }) => (
              <Text style={[styles.startButtonText, pressed && { color: '#FFF' }]}>Próximo Nível</Text>
            )}
          </Pressable>
        </View>
        {renderExitModal()}
      </View>
    );
  }

  if (gameState === 'finished') {
    return (
    <View style={styles.boardArea}>
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
                <Text style={[styles.playAgainText, pressed && { color: '#FFF' }]}>Montar Novamente</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={{ width: '100%', marginTop: 12 }}>
          <Pressable 
            style={({ pressed }) => [
              styles.leaveButton,
              pressed && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            ]} 
            onPress={handleRequestExit}
          >
            {({ pressed }) => (
              <Text style={[styles.leaveButtonText, pressed && { color: '#FFF' }]}>Voltar ao Início</Text>
            )}
          </Pressable>
        </View>
        {renderExitModal()}
      </View>
    );
  }

  return (
    <View style={styles.boardArea}>
      <TouchableOpacity onPress={handleRequestExit} style={[styles.backButton, { zIndex: 999 }]}>
        <ArrowLeft color="#fff" size={24} />
      </TouchableOpacity>
      
      <View style={styles.referenceFloating}>
        <TouchableOpacity onPress={() => setShowExpandedReference(true)} activeOpacity={0.7}>
          <Image source={currentImage} style={styles.referenceImage} />
        </TouchableOpacity>
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
          imageSource={currentImage}
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

      {/* Modal da Imagem Expandida */}
      <Modal visible={showExpandedReference} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.9)', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={[styles.expandedTitle, { color: '#fff', fontSize: 24, marginBottom: 20 }]}>Referência do Quebra-Cabeça</Text>
          <Image source={currentImage} style={{ width: 350, height: 350, borderRadius: 20 }} />
          
          <Pressable 
            style={({ pressed }) => [styles.startButton, { marginTop: 40, width: '100%' }, pressed && { backgroundColor: '#7B61FF' }]}
            onPress={() => setShowExpandedReference(false)}
          >
            {({ pressed }) => (
              <Text style={[styles.startButtonText, pressed && { color: '#FFF' }]}>Voltar ao Jogo</Text>
            )}
          </Pressable>
        </View>
      </Modal>

      {renderExitModal()}
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
    padding: 12,
    backgroundColor: 'rgba(255, 246, 227, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
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
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    marginBottom: 40,
  },
  instructionsDesc: {
    fontSize: 18,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 26,
  },
  startButton: {
    backgroundColor: '#FFC857',
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
    borderRadius: 4,
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
    width: 130,
    height: 130,
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
  },
  leaveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  expandedImage: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 24,
    resizeMode: 'contain',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
