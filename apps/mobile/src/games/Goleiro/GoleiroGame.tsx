import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, 
  Image, Animated, Pressable, Modal, Easing, Dimensions, LogBox, Platform
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Shield, ArrowLeft, Trophy, X, Frown, Settings } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei/native';
import { GoleiroCurveEditor, CurveSlot, STORAGE_KEY, GLOBAL_SIZE_KEY } from './GoleiroCurveEditor';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- SILENCIADOR DE LOGS (Para limpar o terminal) ---
LogBox.ignoreLogs(['THREE.Clock', "EXGL: gl.pixelStorei()"]);

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
  originalWarn(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('EXGL: gl.pixelStorei()')) return;
  originalLog(...args);
};
// ----------------------------------------------------

// --- COMPONENTE DA BOLA 3D ---
const Bola3D = ({ targetRotations, duration, startTime, globalStartSize }: { targetRotations: any, duration: number, startTime: number, globalStartSize: number }) => {
  // O Metro agora consegue dar require() no arquivo .glb!
  const { scene } = useGLTF(require('../../../assets/assets_goleiro/bola_futebol_3D.glb') as any);
  const meshRef = useRef<any>(null);
  
  // Clonamos a malha (scene) e forçamos o tamanho/pivô exato para bater 1:1 com a bola 2D
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    
    // Calcula o tamanho real (Bounding Box) do modelo .glb do usuário
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Como o nosso Canvas agora tem 300x300 pixels (para evitar que a bola seja cortada ao crescer),
    // queremos que o tamanho base (scale=1) seja equivalente a 100 pixels.
    // Ajuste: 0.6x para nascer ainda menor (mais harmônico), conforme solicitado.
    const targetDiameter = (4.66 / 3) * 0.6; 
    const scaleFactor = targetDiameter / maxDim;
    
    // Guardamos o scaleFactor no userData para acessar no useFrame
    clone.userData.baseScale = scaleFactor;
    clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Centraliza o Pivô perfeitamente
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x * scaleFactor, -center.y * scaleFactor, -center.z * scaleFactor);
    
    return clone;
  }, [scene]);

  useFrame(() => {
    if (meshRef.current && duration > 0) {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration); // vai de 0 até 1 durante o chute
      
      // Aplicar rotação física real em radianos
      meshRef.current.rotation.x = (targetRotations.x * t) * (Math.PI / 180);
      meshRef.current.rotation.y = (targetRotations.y * t) * (Math.PI / 180);
      meshRef.current.rotation.z = (targetRotations.z * t) * (Math.PI / 180);
      
      // Aplicar o Crescimento de Escala DENTRO do motor 3D
      const startScale = globalStartSize / 100;
      // Ajuste: Cresce até 1.66x (compensando a redução inicial para 0.6, mantendo o tamanho final igual)
      const currentScale = startScale + ((1.66 - startScale) * t); 
      const finalScale = clonedScene.userData.baseScale * currentScale;
      meshRef.current.scale.set(finalScale, finalScale, finalScale);
    }
  });

  return <primitive ref={meshRef} object={clonedScene} scale={1} />; 
};
// PRÉ-CARREGAMENTO FORÇADO DO MODELO NA MEMÓRIA PARA EVITAR LAG INICIAL
useGLTF.preload(require('../../../assets/assets_goleiro/bola_futebol_3D.glb') as any);
// -----------------------------


interface GoleiroGameProps {
  onBack: () => void;
}

const TOTAL_SHOTS = 20;

// Default curves if AsyncStorage is empty
const DEFAULT_SLOTS: CurveSlot[] = [
  { id: '1', p0: { x: 50, y: 90 }, p1: { x: 80, y: 50 }, p2: { x: 15, y: 20 } }, // Ângulo Esquerdo com curva
  { id: '2', p0: { x: 50, y: 90 }, p1: { x: 20, y: 50 }, p2: { x: 85, y: 20 } }, // Ângulo Direito com curva
  { id: '3', p0: { x: 50, y: 90 }, p1: { x: 50, y: 40 }, p2: { x: 50, y: 30 } }, // Foguete central
];

export const GoleiroGame: React.FC<GoleiroGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'playing' | 'timeout' | 'editor'>('menu');
  const [menuStep, setMenuStep] = useState<1 | 2>(1);
  const [countdownValue, setCountdownValue] = useState<number | string>(3);
  const [showExitModal, setShowExitModal] = useState(false);
  const [score, setScore] = useState(0); 
  const [currentShot, setCurrentShot] = useState(0); 
  
  const [isBallActive, setIsBallActive] = useState(false);
  const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);
  const [gloveZIndex, setGloveZIndex] = useState(30);

  const [availableSlots, setAvailableSlots] = useState<CurveSlot[]>(DEFAULT_SLOTS);
  const [activeSlot, setActiveSlot] = useState<CurveSlot | null>(null);
  const [globalStartSize, setGlobalStartSize] = useState(10);

  // Anim
  const shotProgressAnim = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const glovePosAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gloveScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Refs
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ballAppearTimeRef = useRef<number>(0);
  const isShotProcessedRef = useRef(false);
  const reactionTimesRef = useRef<number[]>([]);
  const targetRotationsRef = useRef({ z: 0, x: 0, y: 0 });
  const currentDurationRef = useRef<number>(2000); // Guardar a duração real do chute atual para o Canvas
  const currentProgressRef = useRef<number>(0);
  const currentShotRef = useRef<number>(0);

  // Audio
  const soundsRef = useRef<{ 
    success: Audio.Sound | null; error: Audio.Sound | null; win: Audio.Sound | null;
    chute: Audio.Sound | null; defesa: Audio.Sound | null;
  }>({
    success: null, error: null, win: null, chute: null, defesa: null
  });

  useEffect(() => {
    let isMounted = true;
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: false });
        
        const { sound: success } = await Audio.Sound.createAsync(require('../../../assets/click_correto_gonogo.mp3'));
        const { sound: error } = await Audio.Sound.createAsync(require('../../../assets/click_incorreto_gonogo.mp3'));
        const { sound: win } = await Audio.Sound.createAsync(require('../../../assets/venceu-jogo.mp3'));
        const { sound: chute } = await Audio.Sound.createAsync(require('../../../assets/chute_bola.mp3'));
        const { sound: defesa } = await Audio.Sound.createAsync(require('../../../assets/defesa_luva.mp3'));
        
        await success.setVolumeAsync(1.0); await error.setVolumeAsync(1.0); await win.setVolumeAsync(1.0);
        await chute.setVolumeAsync(1.0); await defesa.setVolumeAsync(1.0);
        
        if (isMounted) soundsRef.current = { success, error, win, chute, defesa };
      } catch (e) { console.error("Erro ao carregar sons", e); }
    };
    loadSounds();
    loadSavedCurves();

    const progId = shotProgressAnim.addListener(({ value }) => {
      currentProgressRef.current = value;
    });

    return () => {
      isMounted = false;
      shotProgressAnim.removeListener(progId);
      soundsRef.current.success?.unloadAsync();
      soundsRef.current.error?.unloadAsync();
      soundsRef.current.win?.unloadAsync();
    };
  }, []);

  const loadSavedCurves = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        let parsed = JSON.parse(data);

        // --- SCRIPT DE LIMPEZA DEFINITIVO ---
        if (parsed.length > 40) {
          parsed = parsed.slice(0, 40); // Mantém apenas as primeiras 40 curvas
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          console.log('\n✅ [CHAT] A 41ª curva foi excluída com sucesso! Total agora é 40.\n');
        }
        // ------------------------------------

        if (parsed.length > 0) {
          console.log(`\n=== ⚽ CURVAS CARREGADAS: ${parsed.length} ===`);
          console.log(JSON.stringify(parsed, null, 2));
          console.log(`===================================\n`);
          setAvailableSlots(parsed);
        }
      } else {
        setAvailableSlots(DEFAULT_SLOTS);
      }
      
      const sizeData = await AsyncStorage.getItem(GLOBAL_SIZE_KEY);
      if (sizeData) {
        setGlobalStartSize(parseInt(sizeData, 10));
      }
    } catch (e) {
      console.error(e);
      setAvailableSlots(DEFAULT_SLOTS);
    }
  };

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); };
  }, []);

  const clearAllTimeouts = () => {
    if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
    if (shotTimeoutRef.current) clearTimeout(shotTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleRequestExit = () => setShowExitModal(true);
  const cancelExit = () => setShowExitModal(false);
  const confirmExit = () => {
    setShowExitModal(false);
    clearAllTimeouts();
    onBack();
  };

  const startCountdown = () => {
    setGameState('countdown');
    setCountdownValue(3);
    let count = 3;

    const runAnimation = () => {
      countdownAnim.setValue(0);
      Animated.timing(countdownAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }).start();
    };
    runAnimation();

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count); runAnimation();
      } else if (count === 0) {
        setCountdownValue('JÁ!'); runAnimation();
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        startGame();
      }
    }, 1000);
  };

  const startGame = () => {
    setScore(0);
    setCurrentShot(0);
    currentShotRef.current = 0;
    reactionTimesRef.current = [];
    setGameState('playing');
    setMenuStep(1);
    setIsBallActive(false);
    queueNextShot();
  };

  const queueNextShot = () => {
    if (currentShotRef.current >= TOTAL_SHOTS) {
      endGame();
      return;
    }
    const delay = Math.floor(Math.random() * 1500) + 1000;
    spawnTimeoutRef.current = setTimeout(() => spawnBall(), delay);
  };

  const spawnBall = () => {
    currentShotRef.current += 1;
    setCurrentShot(currentShotRef.current);
    isShotProcessedRef.current = false;
    
    // Choose random slot (curve)
    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    setActiveSlot(randomSlot);
    setIsBallActive(true);
    setFlashType(null);
    ballAppearTimeRef.current = Date.now();
    
    // Play kick sound
    soundsRef.current.chute?.playFromPositionAsync(0);
    
    // Reset Gloves
    glovePosAnim.setValue({ x: 0, y: 0 });
    gloveScaleAnim.setValue(1);
    setGloveZIndex(30);

    const p0 = randomSlot.p0;
    const p1 = randomSlot.p1;
    const p2 = randomSlot.p2;
    // Cross product to find curve direction for Magnus effect
    const crossProduct = (p2.x - p0.x) * (p1.y - p0.y) - (p2.y - p0.y) * (p1.x - p0.x);
    const spinDirection = crossProduct > 0 ? -1 : 1;

    // Randomize 3D tumbling targets
    targetRotationsRef.current = {
      z: spinDirection * (360 + Math.random() * 720), // 360 to 1080 deg
      x: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
      y: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
    };

    const shotDuration = 3500; // Tempo de voo travado em 3.5 segundos!
    currentDurationRef.current = shotDuration;

    shotProgressAnim.setValue(0);
    Animated.timing(shotProgressAnim, {
      toValue: 1,
      duration: shotDuration,
      easing: Easing.linear, // Use linear so the Bezier curve defines the speed organically
      useNativeDriver: false, // Must be false to animate left/top properties directly via interpolate
    }).start();

    shotTimeoutRef.current = setTimeout(() => {
      if (!isShotProcessedRef.current) {
        handleMiss();
      }
    }, shotDuration);
  };

  const handleSave = () => {
    if (isShotProcessedRef.current) return;
    
    // Feedback imediato do impacto inicial (Apenas Som)
    soundsRef.current.defesa?.playFromPositionAsync(0);
    
    const timeSinceSpawn = Date.now() - ballAppearTimeRef.current;
    
    // Penalidade por clique antecipado (Vermelho/Amarelo)
    if (timeSinceSpawn < 2500) {
      handleMiss();
      return;
    }

    // Sucesso! Clicou no momento exato (Verde)
    // O cronômetro psicométrico real só começa a contar a partir dos 2500ms (momento em que a bola fica verde e clicável)
    const reactionTime = timeSinceSpawn - 2500;
    
    isShotProcessedRef.current = true;
    
    if (shotTimeoutRef.current) clearTimeout(shotTimeoutRef.current);
    shotProgressAnim.stopAnimation();
    
    // ---- Animação das Luvas Pegando a Bola ----
    if (activeSlot) {
      const { width, height } = Dimensions.get('window');
      const t = currentProgressRef.current;
      
      const p0 = activeSlot.p0;
      const p1 = activeSlot.p1;
      const p2 = activeSlot.p2;
      const bx = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
      const by = Math.pow(1-t, 2) * p0.y + 2 * (1-t) * t * p1.y + Math.pow(t, 2) * p2.y;
      
      const targetPixelX = (bx / 100) * width;
      const targetPixelY = (by / 100) * height;
      
      const gloveRestX = width / 2;
      // Ajuste: O container agora é fixo de 400x300.
      // Topo = height - 220. Centro = height - 70. Palmas um pouco acima = height - 120.
      const gloveRestY = height - 120; 
      
      const deltaX = targetPixelX - gloveRestX;
      const deltaY = targetPixelY - gloveRestY;
      
      setGloveZIndex(1000); // Joga a luva pra cima da bola
      
      Animated.parallel([
        Animated.timing(glovePosAnim, {
          toValue: { x: deltaX, y: deltaY },
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad)
        }),
        Animated.timing(gloveScaleAnim, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad)
        })
      ]).start(() => {
        // Toca o som de acerto (ponto) e vibra perfeitamente sincronizado com o impacto da luva!
        soundsRef.current.success?.replayAsync();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      });
    } else {
      soundsRef.current.success?.replayAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // ------------------------------------------

    reactionTimesRef.current.push(reactionTime);

    setScore(prev => prev + 1);
    setFlashType('success');
    
    setTimeout(() => {
      setIsBallActive(false);
      setFlashType(null);
      queueNextShot();
    }, 500);
  };

  const handleMiss = () => {
    if (isShotProcessedRef.current) return;
    isShotProcessedRef.current = true;
    
    if (shotTimeoutRef.current) clearTimeout(shotTimeoutRef.current);
    shotProgressAnim.stopAnimation();
    
    setFlashType('error');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    soundsRef.current.error?.playFromPositionAsync(0);
    
    setTimeout(() => {
      setIsBallActive(false);
      setFlashType(null);
      queueNextShot();
    }, 800);
  };

  const endGame = () => {
    setGameState('timeout');
    clearAllTimeouts();
    soundsRef.current.win?.replayAsync();
    
    // Envia os dados para a API Python (cálculo do VTR)
    const telemetryPayload = {
      game: 'goleiro',
      reaction_times_ms: reactionTimesRef.current
    };
    
    // Forçando o IP real da máquina para que funcione tanto no emulador quanto no device físico via Wi-Fi
    const apiUrl = 'http://10.246.21.235:3002/api/calculo/goleiro';
    
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetryPayload)
    }).then(res => res.json())
      .then(data => console.log('VTR Python API Success:', data))
      .catch(err => console.log('Failed to send telemetry:', err));
  };

  // Helper to pre-calculate bezier interpolations
  const getInterpolations = () => {
    if (!activeSlot) return null;
    
    const steps = 50;
    const inputRange = [];
    for(let i=0; i<=steps; i++) inputRange.push(i / steps);

    const { z: targetZ, x: targetX, y: targetY } = targetRotationsRef.current;
    
    const getCurveForDelay = (delayT: number) => {
      const outX = [];
      const outY = [];
      const outScale = [];
      const outRotZ = [];
      const outRotX = [];
      const outRotY = [];
      
      for(let i=0; i<=steps; i++) {
        let t = i / steps;
        let t_delayed = Math.max(0, t - delayT);
        
        const p0 = activeSlot.p0;
        const p1 = activeSlot.p1;
        const p2 = activeSlot.p2;

        const bx = Math.pow(1-t_delayed, 2) * p0.x + 2 * (1-t_delayed) * t_delayed * p1.x + Math.pow(t_delayed, 2) * p2.x;
        const by = Math.pow(1-t_delayed, 2) * p0.y + 2 * (1-t_delayed) * t_delayed * p1.y + Math.pow(t_delayed, 2) * p2.y;
        
        const startScale = globalStartSize / 100;

        outX.push(`${bx}%`);
        outY.push(`${by}%`);
        outScale.push(startScale + ((1.66 - startScale) * t_delayed));
        
        outRotZ.push(`${targetZ * t_delayed}deg`);
        outRotX.push(`${targetX * t_delayed}deg`);
        outRotY.push(`${targetY * t_delayed}deg`);
      }

      return {
        x: shotProgressAnim.interpolate({ inputRange, outputRange: outX }),
        y: shotProgressAnim.interpolate({ inputRange, outputRange: outY }),
        scale: shotProgressAnim.interpolate({ inputRange, outputRange: outScale }),
        rotZ: shotProgressAnim.interpolate({ inputRange, outputRange: outRotZ }),
        rotX: shotProgressAnim.interpolate({ inputRange, outputRange: outRotX }),
        rotY: shotProgressAnim.interpolate({ inputRange, outputRange: outRotY }),
      };
    };

    const ringColor = shotProgressAnim.interpolate({
      inputRange: [0, 0.42, 0.43, 0.71, 0.72, 1], // 1.5s (42%) -> 2.5s (71%) -> 3.5s (100%)
      outputRange: ['#FF3B30', '#FF3B30', '#FFCC00', '#FFCC00', '#34C759', '#34C759'] // Vermelho -> Amarelo -> Verde
    });

    const innerRingScale = shotProgressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.01, 1] // Começa como um ponto e cresce até o tamanho exato da bola
    });

    return {
      main: {
        ...getCurveForDelay(0),
        ringColor,
        innerRingScale
      }
    };
  };

  const animStyle = isBallActive ? getInterpolations() : null;

  const renderExitModal = () => (
    <Modal visible={showExitModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.menuBox}>
          <TouchableOpacity style={styles.closeModalButton} onPress={cancelExit}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={styles.frownIconWrapper}>
            <Frown color="#FFC857" size={48} />
          </View>
          <Text style={styles.exitModalTitle}>Puxa vida...</Text>
          <Text style={styles.exitModalText}>Você já vai embora?{'\n'}O campeonato não acabou!</Text>
          <View style={styles.exitModalButtons}>
            <Pressable onPress={cancelExit} style={({ pressed }) => [styles.stayButton, pressed && styles.playButtonPressed]}>
              {({ pressed }) => <Text style={[styles.stayButtonText, pressed && { color: '#FFF' }]}>Quero ficar!</Text>}
            </Pressable>
            <TouchableOpacity style={styles.leaveButton} onPress={confirmExit}>
              <Text style={styles.leaveButtonText}>Sair do Jogo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (gameState === 'editor') {
    return <GoleiroCurveEditor onBack={() => { setGameState('menu'); loadSavedCurves(); }} />;
  }

  return (
    <View style={styles.container}>
      {renderExitModal()}
      
      <ImageBackground 
        source={isBallActive 
          ? require('../../../assets/assets_goleiro/bola_chutada.png') 
          : require('../../../assets/assets_goleiro/campo_futebol.png')
        } 
        style={styles.container}
        resizeMode="cover"
      >
        {flashType === 'success' && <View style={[styles.flashOverlay, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />}
        {flashType === 'error' && <View style={[styles.flashOverlay, { backgroundColor: 'rgba(255, 0, 0, 0.4)' }]} />}

        <View style={styles.header} pointerEvents="box-none">
          {gameState === 'playing' ? (
            <TouchableOpacity onPress={handleRequestExit} style={styles.backButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ) : false && gameState === 'menu' && (
            <TouchableOpacity onPress={() => setGameState('editor')} style={styles.editorButton}>
              <Settings color="#fff" size={24} />
              <Text style={{color: '#FFF', fontWeight: 'bold', marginLeft: 8}}>Editor de Curvas</Text>
            </TouchableOpacity>
          )}

          {gameState === 'playing' && (
            <View style={styles.centerTopStats} pointerEvents="none">
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>
                  Chutes: {currentShot}/{TOTAL_SHOTS}
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Shield color="#FFD700" size={16} />
                <Text style={styles.scoreText}>{score}</Text>
              </View>
            </View>
          )}
        </View>

        {(gameState === 'playing' || gameState === 'countdown') && (
          <Animated.View 
            style={[
              styles.glovesContainer, 
              { 
                zIndex: gloveZIndex,
                transform: [
                  { translateX: glovePosAnim.x },
                  { translateY: glovePosAnim.y },
                  { scale: gloveScaleAnim }
                ] 
              }
            ]} 
            pointerEvents="none"
          >
            <Image 
              source={require('../../../assets/assets_goleiro/luvas_goleiro.png')} 
              style={styles.glovesImage}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {gameState === 'menu' && (
          <View style={styles.centerContent} pointerEvents="box-none">
            <View style={styles.menuBox}>
              {menuStep === 1 && (
                <>
                  <Text style={styles.title}>Goleiro</Text>
                  <Text style={styles.subtitle}>Teste seus reflexos! Defenda todas as bolas antes que elas entrem no gol.</Text>
                  <Pressable 
                    style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
                    onPress={() => setMenuStep(2)}
                  >
                    {({ pressed }) => <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>PRÓXIMO</Text>}
                  </Pressable>
                </>
              )}

              {menuStep === 2 && (
                <>
                  <Text style={[styles.title, { marginBottom: 8 }]}>Como Jogar</Text>
                  
                  <Text style={[styles.subtitle, { fontSize: 16, marginBottom: 8, paddingHorizontal: 16, lineHeight: 22 }]}>
                    Toque na bola no exato momento em que o círculo ficar <Text style={{ color: '#34C759', fontWeight: '900' }}>VERDE</Text>!
                  </Text>

                  <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'absolute', transform: [{ scale: 1.5 }] }}>
                      <Circle cx="55" cy="55" r="30" stroke="#34C759" strokeWidth="4" fill="transparent" strokeOpacity={0.8} />
                      <Circle cx="55" cy="55" r="22" stroke="#34C759" strokeWidth="3" fill="transparent" strokeOpacity={0.6} />
                    </Svg>
                    <Image 
                      source={require('../../../assets/assets_goleiro/bola.png')} 
                      style={{ width: 90, height: 90 }} 
                      resizeMode="contain" 
                    />
                  </View>

                  <Text style={[styles.subtitle, { fontSize: 15, marginBottom: 16, paddingHorizontal: 16, color: '#FFF', lineHeight: 20 }]}>
                    Tocou <Text style={{ fontWeight: 'bold' }}>cedo demais</Text> ou deixou <Text style={{ fontWeight: 'bold' }}>passar</Text>? Ponto do adversário!
                  </Text>
                  
                  <View style={styles.actionButtonsRow}>
                    <Pressable 
                      style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]} 
                      onPress={() => setMenuStep(1)}
                    >
                      {({ pressed }) => <Text style={[styles.secondaryButtonText, pressed && { color: '#7B61FF' }]}>VOLTAR</Text>}
                    </Pressable>
                    <Pressable 
                      style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
                      onPress={startCountdown}
                    >
                      {({ pressed }) => <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>COMEÇAR!</Text>}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {gameState === 'countdown' && (
          <View style={[styles.centerContent, styles.countdownOverlay]}>
            <Animated.Text style={[styles.countdownText, { 
              opacity: countdownAnim,
              transform: [{ scale: countdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]
            }]}>
              {countdownValue}
            </Animated.Text>
          </View>
        )}

        {/* Pré-compilação do Canvas: Sempre visível para forçar compilação de shader, mas mantido fora da tela! */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          
          {/* Bola Principal (Renderização True 3D + SVG Hitbox) */}
          <Animated.View style={[styles.ballContainer, {
              left: (gameState === 'playing' && isBallActive && animStyle) ? animStyle.main.x : -1000,
              top: (gameState === 'playing' && isBallActive && animStyle) ? animStyle.main.y : -1000,
              transform: [
                { translateX: -50 },
                { translateY: -50 }
              ],
              zIndex: 999
            }
          ]} pointerEvents="box-none">
            
            {/* Canvas Expandido (Não recebe toque) */}
            <View style={{
              position: 'absolute',
              width: 300, height: 300,
              left: -100, top: -100
            }} pointerEvents="none">
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ backgroundColor: 'transparent' }}>
                <ambientLight intensity={1.2} />
                <directionalLight position={[10, 10, 5]} intensity={2.5} />
                <React.Suspense fallback={null}>
                  <Bola3D 
                    targetRotations={targetRotationsRef.current || {x:0, y:0, z:0}} 
                    duration={currentDurationRef.current || 3500} 
                    startTime={ballAppearTimeRef.current || Date.now()} 
                    globalStartSize={globalStartSize || 15}
                  />
                </React.Suspense>
              </Canvas>
            </View>

            {/* Apenas renderiza a interação (SVGs e Botões) se a bola estiver ativa */}
            {gameState === 'playing' && isBallActive && animStyle && (
              <Animated.View style={{
                 position: 'absolute', width: 100, height: 100,
                 transform: [{ scale: animStyle.main.scale }]
              }}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleSave}>
                  {/* Anel Estático (Contorna perfeitamente a bola) */}
                  <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Svg width="110" height="110" viewBox="0 0 110 110">
                      <AnimatedCircle cx="55" cy="55" r="30" stroke={animStyle.main.ringColor} strokeWidth="4" fill="transparent" strokeOpacity={0.8} />
                    </Svg>
                  </Animated.View>

                  {/* Anel Interno (Nasce no centro e expande até colar no anel estático) */}
                  <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ scale: animStyle.main.innerRingScale }] }]}>
                    <Svg width="110" height="110" viewBox="0 0 110 110">
                      <AnimatedCircle cx="55" cy="55" r="30" stroke={animStyle.main.ringColor} strokeWidth="3" fill="transparent" strokeOpacity={0.6} />
                    </Svg>
                  </Animated.View>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {gameState === 'timeout' && (
          <View style={styles.centerContent} pointerEvents="box-none">
            <View style={styles.menuBox}>
              <Trophy color="#FFC857" size={64} style={{ marginBottom: 16 }} />
              <Text style={styles.title}>Fim de Jogo!</Text>
              <Text style={styles.subtitle}>
                Parabéns pelo seu esforço! Você defendeu <Text style={{ color: '#FFC857', fontWeight: 'bold' }}>{score}</Text> de {TOTAL_SHOTS} chutes.
              </Text>
              <View style={styles.actionButtonsRow}>
                <Pressable 
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                  onPress={onBack}
                >
                  {({ pressed }) => <Text style={[styles.secondaryButtonText, pressed && { color: '#7B61FF' }]}>Sair do Jogo</Text>}
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
                  onPress={startGame}
                >
                  {({ pressed }) => <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>JOGAR NOVAMENTE</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, width: '100%', height: '100%',
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 24, paddingTop: 40, zIndex: 50,
  },
  editorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  centerTopStats: {
    position: 'absolute', top: '2%', left: 0, right: 0,
    alignItems: 'center', gap: 6, zIndex: 60,
    transform: [{ translateX: 7 }],
  },
  timerBox: {
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  timerText: {
    color: '#FFF', fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'],
  },
  scoreBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreText: {
    color: '#FFD700', fontSize: 16, fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  closeModalButton: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
  },
  frownIconWrapper: {
    marginBottom: 16, backgroundColor: 'rgba(255,200,87,0.1)', padding: 16, borderRadius: 50,
  },
  exitModalTitle: {
    color: '#FFC857', fontSize: 32, fontWeight: 'bold', marginBottom: 8, textAlign: 'center',
  },
  exitModalText: {
    color: '#FFF', fontSize: 18, textAlign: 'center', lineHeight: 26, marginBottom: 32,
  },
  exitModalButtons: {
    flexDirection: 'row', gap: 16, alignItems: 'center',
  },
  stayButton: {
    backgroundColor: '#FFC857', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 99, alignItems: 'center',
  },
  stayButtonText: {
    color: '#084D48', fontSize: 16, fontWeight: '900',
  },
  leaveButton: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 99, alignItems: 'center', backgroundColor: 'transparent',
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, fontWeight: 'bold',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  centerContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  menuBox: {
    backgroundColor: 'rgba(24, 28, 28, 0.95)', padding: 32, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', width: '90%', maxWidth: 600,
    minHeight: 340, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 48, color: '#FFF', fontWeight: '900', textAlign: 'center', marginBottom: 16,
  },
  subtitle: {
    fontSize: 20, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 24, lineHeight: 28,
  },
  tutorialImageContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2, borderColor: '#7B61FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row', backgroundColor: '#FFC857', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 99, alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#FFC857', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 12, elevation: 8, borderWidth: 2, borderColor: '#FFC857',
  },
  playButtonPressed: {
    backgroundColor: '#7B61FF', shadowColor: '#7B61FF', borderColor: '#7B61FF', transform: [{ scale: 0.96 }],
  },
  playButtonText: {
    color: '#084D48', fontSize: 20, fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row', gap: 16, marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row', backgroundColor: 'transparent', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 99, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFC857',
  },
  secondaryButtonPressed: {
    borderColor: '#7B61FF', transform: [{ scale: 0.96 }],
  },
  secondaryButtonText: {
    color: '#FFC857', fontSize: 20, fontWeight: '900',
  },
  countdownOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)', ...StyleSheet.absoluteFillObject,
  },
  countdownText: {
    fontSize: 160, fontWeight: '900', color: '#FFC857',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 16,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 10,
  },
  glovesContainer: {
    position: 'absolute', bottom: -80, 
    left: '50%', marginLeft: -200, 
    width: 400, height: 300, 
    alignItems: 'center', justifyContent: 'center', zIndex: 30,
  },
  glovesImage: {
    width: '100%', height: '100%', opacity: 0.9,
  },
  ballContainer: {
    position: 'absolute', width: 100, height: 100, zIndex: 40,
  },
  ballImage: {
    width: '100%', height: '100%',
  }
});
