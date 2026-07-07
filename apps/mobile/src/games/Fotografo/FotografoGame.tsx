import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, 
  Image, Animated, Pressable, Modal
} from 'react-native';
import { Camera, ArrowLeft, Trophy, Play, Timer, X, Frown } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface FotografoGameProps {
  onBack: () => void;
}

type AnimalType = 'urso' | 'cobra' | 'aguia' | 'coruja' | 'passaro' | 'macaco';

const ANIMAL_IMAGES: Record<AnimalType, any> = {
  urso: require('../../../assets/assets fotografo_floresta/urso.png'),
  cobra: require('../../../assets/assets fotografo_floresta/cobra.png'),
  aguia: require('../../../assets/assets fotografo_floresta/aguia.png'),
  coruja: require('../../../assets/assets fotografo_floresta/coruja.png'),
  passaro: require('../../../assets/assets fotografo_floresta/passaro.png'),
  macaco: require('../../../assets/assets fotografo_floresta/macaco.png'),
};

interface EditorSlot {
  id: string;
  type: AnimalType;
  x: number;
  y: number;
  size: number;
}

// OS PONTOS REFATORADOS E AJUSTADOS PELO USUÁRIO
const EDITOR_SLOTS: EditorSlot[] = [
    { id: 'slot_vsh8b', type: 'passaro', x: 76.35, y: 20.39, size: 75 },
    { id: 'slot_jdvdmv', type: 'aguia', x: 76.5, y: 20.08, size: 70 },
    { id: 'slot_0pecvp', type: 'coruja', x: 76.19, y: 19.54, size: 70 },
    { id: 'slot_z1ib3p', type: 'urso', x: 78.43, y: 70.09, size: 120 },
    { id: 'slot_su3htd', type: 'cobra', x: 80.84, y: 66.86, size: 115 },
    { id: 'slot_uuc4xr', type: 'macaco', x: 81.02, y: 74.02, size: 115 },
    { id: 'slot_7dbh0p', type: 'cobra', x: 40.64, y: 88.34, size: 90 },
    { id: 'slot_k93m3e', type: 'urso', x: 34.28437658945719, y: 73.89528201633027, size: 130 },
    { id: 'slot_6349wp', type: 'macaco', x: 37.89416603088379, y: 78.7036068725586, size: 105 },
    { id: 'slot_eqboh', type: 'cobra', x: 17.02374825159708, y: 83.52518094663267, size: 85 },
    { id: 'slot_rkhbin', type: 'coruja', x: 17.76862332661947, y: 62.22209564774125, size: 95 },
    { id: 'slot_cvan6a', type: 'passaro', x: 16.86, y: 62.62, size: 125 },
    { id: 'slot_pjfv1e', type: 'passaro', x: 16.768958333333334, y: 81.46360828540944, size: 120 },
    { id: 'slot_7ujwu', type: 'aguia', x: 16.260208969116213, y: 77.85685326470269, size: 125 },
    { id: 'slot_iayxiq', type: 'coruja', x: 15.774166348775228, y: 79.27833050763165, size: 105 },
    { id: 'slot_vs6hi', type: 'passaro', x: 67.12707951863607, y: 79.97647724292896, size: 90 },
    { id: 'slot_54t00o', type: 'aguia', x: 66.94020833333333, y: 77.59537037037036, size: 90 },
    { id: 'slot_poqmeub', type: 'coruja', x: 66.70833587646484, y: 76.266485720034, size: 90 },
    { id: 'slot_wsg9h', type: 'cobra', x: 77.81312881469728, y: 89.83203562418622, size: 105 },
    { id: 'slot_etdqt', type: 'cobra', x: 57.24, y: 73.84, size: 60 },
    { id: 'slot_gpxyte', type: 'passaro', x: 87.73583333333333, y: 60.1030576748318, size: 90 },
    { id: 'slot_v0n8l8', type: 'aguia', x: 88.62291030883787, y: 54.87009047331634, size: 90 },
    { id: 'slot_9uzqf', type: 'coruja', x: 80.2986083984375, y: 60.952322585494436, size: 65 },
    { id: 'slot_c433zl', type: 'macaco', x: 87.3783371480306, y: 59.599629629629625, size: 85 },
    { id: 'slot_zy4mkr', type: 'urso', x: 87.19250127156575, y: 58.53370229085285, size: 90 },
    { id: 'slot_kde6st', type: 'urso', x: 55.72, y: 67.97, size: 90 },
    { id: 'slot_khrg6', type: 'macaco', x: 67.68833206176758, y: 65.67074215359158, size: 90 },
    { id: 'slot_5mkwxe', type: 'passaro', x: 29.83, y: 69.44, size: 100 },
    { id: 'slot_vihrik', type: 'aguia', x: 29.27, y: 68.4, size: 90 },
    { id: 'slot_ld8mfo', type: 'cobra', x: 38.295, y: 70.7167578464084, size: 35 },
    { id: 'slot_21b7q', type: 'urso', x: 43.87583460489909, y: 67.79406983552155, size: 55 },
    { id: 'slot_wyg3gf', type: 'macaco', x: 47.96, y: 70.12, size: 60 },
    { id: 'slot_5p8z3o', type: 'passaro', x: 31.339587148030596, y: 28.265834392971463, size: 80 },
    { id: 'slot_fecu1q', type: 'aguia', x: 30.33416475931804, y: 25.791758906046546, size: 80 },
    { id: 'slot_2g7q36', type: 'coruja', x: 31.270415395100915, y: 25.404538449887877, size: 70 },
    { id: 'slot_td6tg', type: 'passaro', x: 19.846665395100914, y: 28.198425925925918, size: 90 },
    { id: 'slot_233jcg', type: 'aguia', x: 20.352083651224774, y: 27.927315168027523, size: 80 },
    { id: 'slot_tn4t0d', type: 'cobra', x: 3.73, y: 65.83, size: 90 },
    { id: 'slot_rkt0r8', type: 'passaro', x: 4.3, y: 61.26, size: 115 },
    { id: 'slot_cw8n0d', type: 'aguia', x: 4.26, y: 63.62, size: 90 },
    { id: 'slot_s2indl', type: 'macaco', x: 17.138541785875955, y: 63.737225754349325, size: 105 },
    { id: 'slot_3ivb1', type: 'urso', x: 4.48, y: 61.57, size: 110 },
    { id: 'slot_lxq8y', type: 'urso', x: 51.75, y: 84.74, size: 115 },
    { id: 'slot_7zfkca', type: 'macaco', x: 55.41, y: 87.83, size: 105 },
    { id: 'slot_f4zps9', type: 'cobra', x: 53.98, y: 89.14, size: 90 },
    { id: 'slot_danhg', type: 'passaro', x: 80.49916666666664, y: 80.35121218080874, size: 120 },
    { id: 'slot_rrvavj', type: 'passaro', x: 5.970416110356649, y: 69.30453421133535, size: 125 },
    { id: 'slot_a5uoab', type: 'macaco', x: 76.24, y: 20.39, size: 65 },
    { id: 'slot_b05hpe', type: 'macaco', x: 81.3, y: 29.14, size: 75 },
    { id: 'slot_dvaask', type: 'macaco', x: 59.46561543782553, y: 68.5843359035916, size: 75 },
    { id: 'slot_pg5y1', type: 'macaco', x: 21.57, y: 29.793427338776763, size: 75 },
    { id: 'slot_uu6cb', type: 'coruja', x: 29.69, y: 69.21, size: 85 },
];

interface ActiveAnimal {
  slot: EditorSlot;
  id: string;
  duration: number;
}

const GAME_DURATION = 240; // 4 minutes
const TARGET_ANIMAL: AnimalType = 'passaro'; // A criança deve tirar foto do pássaro

const ALL_ANIMALS: AnimalType[] = ['urso', 'cobra', 'aguia', 'coruja', 'passaro', 'macaco'];

const AnimalSprite: React.FC<{ data: ActiveAnimal; onRemove: (id: string) => void }> = ({ data, onRemove }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Schedule fade out
    const fadeOutDelay = data.duration - 500;
    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onRemove(data.id);
      });
    }, fadeOutDelay > 0 ? fadeOutDelay : 0);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View 
      style={[
        styles.animalContainer, 
        { 
          left: `${data.slot.x}%`, 
          top: `${data.slot.y}%`, 
          opacity,
          width: data.slot.size,
          height: data.slot.size,
          transform: [
            { translateX: -data.slot.size / 2 },
            { translateY: -data.slot.size / 2 }
          ]
        }
      ]}
      pointerEvents="none"
    >
      <Image source={ANIMAL_IMAGES[data.slot.type]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </Animated.View>
  );
};

export const FotografoGame: React.FC<FotografoGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'playing' | 'photo_taken' | 'timeout'>('menu');
  const [menuStep, setMenuStep] = useState<1 | 2>(1);
  const [countdownValue, setCountdownValue] = useState<number | string>(3);
  const [isCameraReady, setIsCameraReady] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState<'success' | 'warning'>('success');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeAnimals, setActiveAnimals] = useState<ActiveAnimal[]>([]);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const cameraPulseAnim = useRef(new Animated.Value(1)).current;
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const soundsRef = useRef<{ camera: Audio.Sound | null; ambient: Audio.Sound | null; win: Audio.Sound | null }>({
    camera: null,
    ambient: null,
    win: null,
  });
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadSounds = async () => {
      try {
        const { sound: ambient } = await Audio.Sound.createAsync(require('../../../assets/som_ambiente_floresta.mp3'));
        await ambient.setIsLoopingAsync(true);
        await ambient.setVolumeAsync(0.2);

        const { sound: camera } = await Audio.Sound.createAsync(require('../../../assets/barulho_camera.mp3'));
        await camera.setVolumeAsync(1.0);

        const { sound: win } = await Audio.Sound.createAsync(require('../../../assets/venceu-jogo.mp3'));
        await win.setVolumeAsync(1.0);

        if (isMounted) {
          soundsRef.current = { ambient, camera, win };
          setSoundsLoaded(true);
        }
      } catch (e) {
        console.error("Erro ao carregar sons", e);
        if (isMounted) setSoundsLoaded(true);
      }
    };
    
    loadSounds();

    return () => {
      isMounted = false;
      soundsRef.current.ambient?.unloadAsync();
      soundsRef.current.camera?.unloadAsync();
      soundsRef.current.win?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (soundsLoaded && soundsRef.current.ambient) {
      soundsRef.current.ambient.playAsync();
    }
  }, [soundsLoaded]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('timeout');
      clearAllTimeouts();
      soundsRef.current.win?.replayAsync();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Fade out ambient sound in the last 5 seconds
  useEffect(() => {
    if (gameState === 'playing' && soundsRef.current.ambient) {
      if (timeLeft <= 5 && timeLeft > 0) {
        const newVolume = (timeLeft / 5) * 0.2;
        soundsRef.current.ambient.setVolumeAsync(newVolume);
      } else if (timeLeft === 0) {
        soundsRef.current.ambient.setVolumeAsync(0);
        soundsRef.current.ambient.pauseAsync();
      } else if (timeLeft > 5) {
        soundsRef.current.ambient.setVolumeAsync(0.2);
        soundsRef.current.ambient.playAsync().catch(() => {});
      }
    }
  }, [timeLeft, gameState]);

  const clearAllTimeouts = () => {
    if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current);
    if (countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current);
    setActiveAnimals([]);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    clearAllTimeouts();
    onBack();
  };

  const cancelExit = () => setShowExitModal(false);

  const handleRequestExit = () => setShowExitModal(true);

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
          <Text style={styles.exitModalText}>Você já vai embora?{'\n'}A expedição não acabou!</Text>

          <View style={styles.exitModalButtons}>
            <Pressable 
              onPress={cancelExit} 
              style={({ pressed }) => [styles.stayButton, pressed && styles.playButtonPressed]}
            >
              {({ pressed }) => (
                <Text style={[styles.stayButtonText, pressed && { color: '#FFF' }]}>Quero ficar!</Text>
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

  const removeAnimal = (id: string) => {
    setActiveAnimals(prev => prev.filter(a => a.id !== id));
  };

  const triggerCountdown = () => {
    setGameState('countdown');
    let count = 3;
    setCountdownValue(count);
    const runAnimation = () => {
      countdownAnim.setValue(0);
      Animated.sequence([
        Animated.spring(countdownAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(countdownAnim, { toValue: 0, duration: 150, delay: 500, useNativeDriver: true })
      ]).start();
    };
    runAnimation();
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        runAnimation();
      } else if (count === 0) {
        setCountdownValue('JÁ!');
        runAnimation();
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        startGame();
      }
    }, 1000);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    setMenuStep(1);
    setActiveAnimals([]);
    startRound();
  };

  const startRound = () => {
    if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current);
    setIsCameraReady(true);
    cameraPulseAnim.stopAnimation();
    cameraPulseAnim.setValue(1);
    const roundDuration = Math.floor(Math.random() * 5 + 6) * 1000;
    const numToSpawn = Math.floor(Math.random() * 3) + 1;
    const availableTypes = [...ALL_ANIMALS];
    const typesToSpawn: AnimalType[] = [];
    for (let i = 0; i < numToSpawn; i++) {
      const typeIndex = Math.floor(Math.random() * availableTypes.length);
      typesToSpawn.push(availableTypes[typeIndex]);
      availableTypes.splice(typeIndex, 1);
    }
    const newAnimals: ActiveAnimal[] = [];
    typesToSpawn.forEach(type => {
      const validSlots = EDITOR_SLOTS.filter(s => {
        if (s.type !== type) return false;
        return newAnimals.every(a => {
          const dx = s.x - a.slot.x;
          const dy = s.y - a.slot.y;
          return Math.sqrt(dx * dx + dy * dy) >= 15; 
        });
      });
      if (validSlots.length > 0) {
        const randomSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
        newAnimals.push({ slot: randomSlot, id: Math.random().toString(36).substring(7), duration: roundDuration });
      }
    });
    setActiveAnimals(newAnimals);
    spawnIntervalRef.current = setTimeout(startRound, roundDuration);
  };

  const showFeedback = (type: 'success' | 'warning', text: string) => {
    setFeedbackType(type);
    setFeedbackText(text);
    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      }, 2500);
    });
  };

  const takePhoto = () => {
    if (!isCameraReady) {
      showFeedback('warning', 'A câmera recarregando!');
      return;
    }
    
    soundsRef.current.camera?.replayAsync();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setIsCameraReady(false);
    Animated.loop(
      Animated.sequence([
        Animated.timing(cameraPulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(cameraPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    ).start();
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    if (activeAnimals.some(a => a.slot.type === TARGET_ANIMAL)) {
      setScore(prev => prev + 1);
      showFeedback('success', 'Que foto linda!');
    }
  };

  return (
    <View style={styles.container}>
      {renderExitModal()}
      <ImageBackground 
        source={require('../../../assets/assets fotografo_floresta/fundo_floresta.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />
        <View style={styles.header} pointerEvents="box-none">
          {gameState === 'playing' && (
            <TouchableOpacity onPress={handleRequestExit} style={styles.backButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          )}
          {gameState === 'playing' && (
            <View style={styles.centerTopStats} pointerEvents="none">
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Trophy color="#FFD700" size={16} />
                <Text style={styles.scoreText}>{score}</Text>
              </View>

              <Animated.View 
                style={[
                  styles.feedbackContainer, 
                  { opacity: feedbackAnim },
                  feedbackType === 'success' && styles.feedbackSuccess
                ]} 
              >
                <Text style={[
                  styles.feedbackText,
                  feedbackType === 'success' && styles.feedbackTextSuccess
                ]}>
                  {feedbackText}
                </Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Menu State */}
        {gameState === 'menu' && (
          <View style={styles.centerContent}>
            <View style={styles.menuBox}>
              {menuStep === 1 && (
                <>
                  <Text style={styles.title}>Fotógrafo da Floresta</Text>
                  <Text style={styles.subtitle}>Explore a floresta misteriosa e prove que você é o fotógrafo mais rápido da natureza!</Text>
                  
                  <Pressable 
                    style={({ pressed }) => [
                      styles.playButton,
                      pressed && styles.playButtonPressed
                    ]}
                    onPress={() => setMenuStep(2)}
                  >
                    {({ pressed }) => (
                      <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>PRÓXIMO</Text>
                    )}
                  </Pressable>
                </>
              )}

              {menuStep === 2 && (
                <>
                  <Text style={styles.subtitle}>
                    Tire fotos somente quando <Text style={{ fontWeight: 'bold', color: '#FFF' }}>ESSE passarinho abaixo</Text> aparecer na tela.
                  </Text>
                  
                  <View style={styles.tutorialImageContainer}>
                    <Image source={ANIMAL_IMAGES[TARGET_ANIMAL]} style={styles.tutorialImage} resizeMode="contain" />
                  </View>
                  
                  <Pressable 
                    style={({ pressed }) => [
                      styles.playButton,
                      pressed && styles.playButtonPressed
                    ]} 
                    onPress={triggerCountdown}
                  >
                    {({ pressed }) => (
                      <>
                        <Play color={pressed ? "#FFF" : "#084D48"} size={32} fill={pressed ? "#FFF" : "#084D48"} />
                        <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>COMEÇAR A FOTOGRAFAR</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}

        {/* Countdown State */}
        {gameState === 'countdown' && (
          <View style={[styles.centerContent, styles.countdownOverlay]}>
            <Animated.Text 
              style={[
                styles.countdownText, 
                { 
                  opacity: countdownAnim,
                  transform: [{
                    scale: countdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1]
                    })
                  }]
                }
              ]}
            >
              {countdownValue}
            </Animated.Text>
          </View>
        )}

        {/* Playing State */}
        {gameState === 'playing' && (
          <>
            {activeAnimals.map((active) => (
              <AnimalSprite key={active.id} data={active} onRemove={removeAnimal} />
            ))}

            <Pressable 
              style={{ position: 'absolute', bottom: 16, left: '52%', zIndex: 40, transform: [{ translateX: -31 }] }} 
              onPress={takePhoto}
            >
              {({ pressed }) => (
                <Animated.View style={[
                  styles.cameraButtonBase,
                  !isCameraReady ? styles.cameraButtonReloading : (pressed ? styles.cameraButtonPressed : styles.cameraButtonNormal),
                  !isCameraReady && {
                    opacity: cameraPulseAnim,
                    transform: [
                      { scale: cameraPulseAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.85, 0.95] }) }
                    ]
                  }
                ]}>
                  <Camera color={(!isCameraReady || pressed) ? "#FFF" : "#1a1a1a"} size={36} />
                </Animated.View>
              )}
            </Pressable>
          </>
        )}

        {/* Timeout State */}
        {gameState === 'timeout' && (
          <View style={styles.centerContent}>
            <View style={styles.menuBox}>
              <Timer color="#FFC857" size={64} style={{ marginBottom: 16 }} />
              <Text style={styles.title}>O tempo voou!</Text>
              <Text style={styles.subtitle}>
                Você é incrível! Tirou <Text style={{ color: '#FFC857', fontWeight: 'bold' }}>{score}</Text> fotos lindas do passarinho hoje.
              </Text>
              
              <View style={styles.actionButtonsRow}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed
                  ]}
                  onPress={onBack}
                >
                  {({ pressed }) => (
                    <Text style={[styles.secondaryButtonText, pressed && { color: '#7B61FF' }]}>VOLTAR AO INÍCIO</Text>
                  )}
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed && styles.playButtonPressed
                  ]}
                  onPress={startGame}
                >
                  {({ pressed }) => (
                    <Text style={[styles.playButtonText, pressed && { color: '#FFF' }]}>JOGAR NOVAMENTE</Text>
                  )}
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
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 40,
    zIndex: 50,
  },
  centerTopStats: {
    position: 'absolute',
    top: '2%',
    left: '52%',
    transform: [{ translateX: -95 }],
    width: 200,
    alignItems: 'center',
    gap: 6,
    zIndex: 60,
  },
  timerBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 6,
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  tutorialImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tutorialImage: {
    width: 90,
    height: 90,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#FFC857',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  playButtonPressed: {
    backgroundColor: '#7B61FF',
    shadowColor: '#7B61FF',
    borderColor: '#7B61FF',
    transform: [{ scale: 0.96 }],
  },
  playButtonText: {
    color: '#084D48',
    fontSize: 20,
    fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  secondaryButtonPressed: {
    borderColor: '#7B61FF',
    transform: [{ scale: 0.96 }],
  },
  secondaryButtonText: {
    color: '#FFC857',
    fontSize: 20,
    fontWeight: '900',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 100,
  },
  cameraButtonBase: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFF',
    overflow: 'hidden',
  },
  cameraButtonNormal: {
    backgroundColor: '#FFC857',
  },
  cameraButtonPressed: {
    backgroundColor: '#7B61FF',
    transform: [{ scale: 0.95 }],
  },
  cameraButtonReloading: {
    backgroundColor: '#7B61FF',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },
  countdownText: {
    fontSize: 160,
    fontWeight: '900',
    color: '#FFC857',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 16,
  },
  feedbackContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    borderColor: '#FFC857',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  feedbackText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  feedbackTextSuccess: {
    color: '#FFC857',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  exitModalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  exitModalButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stayButton: {
    backgroundColor: '#FFC857',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  stayButtonText: {
    color: '#084D48',
    fontSize: 16,
    fontWeight: '900',
  },
  leaveButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 99,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  animalContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  }
});
