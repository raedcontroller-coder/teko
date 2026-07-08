import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, PanResponder, ImageBackground, Dimensions, Alert, Image } from 'react-native';
import { ArrowLeft, Save, Trash2, Undo } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurveSlot = {
  id: string;
  p0: { x: number, y: number };
  p1: { x: number, y: number };
  p2: { x: number, y: number };
  startSize?: number; // size in px
};

export const STORAGE_KEY = '@goleiro_curves';
export const GLOBAL_SIZE_KEY = '@goleiro_global_start_size';

interface EditorProps {
  onBack: () => void;
}

const DEFAULT_P0 = { x: 50, y: 90 };
const DEFAULT_P1 = { x: 80, y: 50 };
const DEFAULT_P2 = { x: 20, y: 20 };

export const GoleiroCurveEditor: React.FC<EditorProps> = ({ onBack }) => {
  const [p0, setP0] = useState(DEFAULT_P0);
  const [p1, setP1] = useState(DEFAULT_P1);
  const [p2, setP2] = useState(DEFAULT_P2);
  const [startSize, setStartSize] = useState(10);
  const [slots, setSlots] = useState<CurveSlot[]>([]);
  const [screenDim, setScreenDim] = useState({ width: Dimensions.get('window').width, height: Dimensions.get('window').height });

  useEffect(() => {
    loadSlots();
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDim({ width: window.width, height: window.height });
    });
    return () => sub?.remove();
  }, []);

  const loadSlots = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSlots(JSON.parse(data));
      }
      const sizeData = await AsyncStorage.getItem(GLOBAL_SIZE_KEY);
      if (sizeData) {
        setStartSize(parseInt(sizeData, 10));
      }
    } catch (e) {
      console.error("Failed to load curves or size", e);
    }
  };

  const saveCurrentCurve = async () => {
    const newSlot: CurveSlot = {
      id: Date.now().toString(),
      p0, p1, p2
    };
    const updated = [...slots, newSlot];
    setSlots(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await AsyncStorage.setItem(GLOBAL_SIZE_KEY, startSize.toString());
      Alert.alert('Salvo', `Curva salva com sucesso! (Total: ${updated.length})`);
    } catch (e) {
      console.error(e);
    }
  };

  const saveGlobalSize = async (newSize: number) => {
    setStartSize(newSize);
    try {
      await AsyncStorage.setItem(GLOBAL_SIZE_KEY, newSize.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const removeLastCurve = async () => {
    if (slots.length === 0) return;
    Alert.alert('Desfazer', 'Deseja remover a ÚLTIMA curva que você salvou?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const updated = [...slots];
        updated.pop(); // remove last element
        setSlots(updated);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }}
    ]);
  };

  const clearAll = async () => {
    Alert.alert('Apagar Tudo', 'Tem certeza que deseja apagar todas as curvas salvas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => {
        setSlots([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
      }}
    ]);
  };

  const toPx = (pct: number, max: number) => (pct / 100) * max;
  const toPct = (px: number, max: number) => Math.max(0, Math.min(100, (px / max) * 100));

  const createDraggablePoint = (
    val: {x: number, y: number},
    setVal: (v: {x: number, y: number}) => void,
    color: string,
    label: string
  ) => {
    const posRef = useRef(val);
    useEffect(() => { posRef.current = val; }, [val]);

    const startPosRef = useRef({ x: 0, y: 0 });

    const pan = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (e, gestureState) => {
          // Store the starting percentage so we can add deltas to it
          startPosRef.current = { x: posRef.current.x, y: posRef.current.y };
        },
        onPanResponderMove: (e, gesture) => {
          const startPxX = toPx(startPosRef.current.x, screenDim.width);
          const startPxY = toPx(startPosRef.current.y, screenDim.height);
          setVal({
            x: toPct(startPxX + gesture.dx, screenDim.width),
            y: toPct(startPxY + gesture.dy, screenDim.height)
          });
        }
      })
    ).current;

    const px = toPx(val.x, screenDim.width);
    const py = toPx(val.y, screenDim.height);

    return (
      <View 
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: px - 24,
          top: py - 24,
          width: 48, height: 48,
          borderRadius: 24,
          backgroundColor: color,
          justifyContent: 'center', alignItems: 'center',
          zIndex: 100,
          borderWidth: 2, borderColor: '#FFF',
          shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5
        }}
      >
        <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>{label}</Text>
      </View>
    );
  };

  const pathData = `M ${toPx(p0.x, screenDim.width)} ${toPx(p0.y, screenDim.height)} Q ${toPx(p1.x, screenDim.width)} ${toPx(p1.y, screenDim.height)} ${toPx(p2.x, screenDim.width)} ${toPx(p2.y, screenDim.height)}`;

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../../assets/assets_goleiro/bola_chutada.png')}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Preview das Bolas nas Origens de Todas as Curvas Salvas */}
        {slots.map(slot => (
          <View key={`ball-${slot.id}`} style={{
            position: 'absolute',
            left: toPx(slot.p0.x, screenDim.width) - (startSize / 2),
            top: toPx(slot.p0.y, screenDim.height) - (startSize / 2),
            width: startSize,
            height: startSize,
            zIndex: 50,
            opacity: 0.6
          }} pointerEvents="none">
            <Image 
              source={require('../../../assets/assets_goleiro/bola.png')}
              style={{width: '100%', height: '100%'}}
              resizeMode="contain"
            />
          </View>
        ))}

        {/* Bola da Curva Atual sendo desenhada */}
        <View style={{
          position: 'absolute',
          left: toPx(p0.x, screenDim.width) - (startSize / 2),
          top: toPx(p0.y, screenDim.height) - (startSize / 2),
          width: startSize,
          height: startSize,
          zIndex: 51,
          opacity: 0.9
        }} pointerEvents="none">
          <Image 
            source={require('../../../assets/assets_goleiro/bola.png')}
            style={{width: '100%', height: '100%'}}
            resizeMode="contain"
          />
        </View>

        {/* SVG Drawing Layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            {/* Draw all saved curves faded out */}
            {slots.map(slot => (
              <Path 
                key={slot.id}
                d={`M ${toPx(slot.p0.x, screenDim.width)} ${toPx(slot.p0.y, screenDim.height)} Q ${toPx(slot.p1.x, screenDim.width)} ${toPx(slot.p1.y, screenDim.height)} ${toPx(slot.p2.x, screenDim.width)} ${toPx(slot.p2.y, screenDim.height)}`}
                fill="none"
                stroke="rgba(255, 200, 87, 0.3)"
                strokeWidth="2"
              />
            ))}

            {/* Current curve being edited */}
            <Path 
              d={pathData}
              fill="none"
              stroke="#FFC857"
              strokeWidth="4"
              strokeDasharray="10, 10"
            />
            {/* Guide lines from control point to endpoints */}
            <Path 
              d={`M ${toPx(p0.x, screenDim.width)} ${toPx(p0.y, screenDim.height)} L ${toPx(p1.x, screenDim.width)} ${toPx(p1.y, screenDim.height)} L ${toPx(p2.x, screenDim.width)} ${toPx(p2.y, screenDim.height)}`}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            />
          </Svg>
        </View>

        {/* Draggable Points */}
        {createDraggablePoint(p0, setP0, '#4CAF50', 'Origem')}
        {createDraggablePoint(p1, setP1, '#2196F3', 'Curva')}
        {createDraggablePoint(p2, setP2, '#F44336', 'Destino')}

        {/* UI Overlay */}
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <View style={styles.rightActions} pointerEvents="box-none">
            <TouchableOpacity onPress={clearAll} style={[styles.iconButton, { backgroundColor: 'rgba(244,67,54,0.8)' }]}>
              <Trash2 color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={removeLastCurve} style={[styles.iconButton, { backgroundColor: '#FF9800', marginLeft: 16 }]}>
              <Undo color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={saveCurrentCurve} style={[styles.iconButton, { backgroundColor: '#7B61FF', marginLeft: 16 }]}>
              <Save color="#fff" size={24} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer} pointerEvents="box-none">
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12, marginBottom: 8 }}>
            <Text style={{color: '#FFF', marginRight: 16, fontWeight: 'bold'}}>Tamanho na Origem: {startSize}px</Text>
            <TouchableOpacity onPress={() => saveGlobalSize(Math.max(1, startSize - 1))} style={styles.sizeButton}>
              <Text style={styles.sizeButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => saveGlobalSize(startSize + 1)} style={styles.sizeButton}>
              <Text style={styles.sizeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
            <Text style={styles.footerText}>Total Salvas: {slots.length}</Text>
          </View>
        </View>

      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 40,
    zIndex: 200,
  },
  iconButton: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  titleBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: 16,
  },
  title: {
    color: '#FFC857', fontSize: 20, fontWeight: 'bold'
  },
  subtitle: {
    color: '#FFF', fontSize: 12
  },
  rightActions: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute', bottom: 24, left: 24,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12,
  },
  footerText: {
    color: '#FFF', fontWeight: 'bold'
  },
  sizeButton: {
    backgroundColor: '#7B61FF',
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4,
  },
  sizeButtonText: {
    color: '#FFF', fontSize: 20, fontWeight: 'bold', lineHeight: 24,
  }
});
