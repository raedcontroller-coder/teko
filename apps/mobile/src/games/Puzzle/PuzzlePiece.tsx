import React, { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, ClipPath, Defs, Image as SvgImage } from 'react-native-svg';
import { getPiecePath, PieceEdges } from './JigsawPathGenerator';

interface PuzzlePieceProps {
  id: string;
  w: number;
  h: number;
  edges: PieceEdges;
  col: number;
  row: number;
  imageSource: any;
  targetX: number;
  targetY: number;
  initialX: number;
  initialY: number;
  boardX: number;
  boardY: number;
  boardW: number;
  boardH: number;
  isPlaced: boolean;
  onAttempt: (id: string, isCorrect: boolean, distance: number) => void;
  fullImageWidth: number;
  fullImageHeight: number;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  id, w, h, edges, col, row, imageSource, targetX, targetY, initialX, initialY, boardX, boardY, boardW, boardH, isPlaced, onAttempt, fullImageWidth, fullImageHeight
}) => {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const [zIndex, setZIndex] = useState(1);
  
  const { path, tabSize } = getPiecePath(w, h, edges);
  
  const svgWidth = w + 2 * tabSize;
  const svgHeight = h + 2 * tabSize;
  
  const imageX = tabSize - col * w;
  const imageY = tabSize - row * h;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isPlaced,
      onPanResponderGrant: () => {
        setZIndex(100);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        // Read absolute synchronous positions before flattening
        const absoluteX = (pan.x as any)._value + (pan.x as any)._offset;
        const absoluteY = (pan.y as any)._value + (pan.y as any)._offset;
        
        pan.flattenOffset();
        setZIndex(1);
        
        const dx = absoluteX - targetX;
        const dy = absoluteY - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const isOverBoard = 
          absoluteX + w/2 > boardX && absoluteX + w/2 < boardX + boardW &&
          absoluteY + h/2 > boardY && absoluteY + h/2 < boardY + boardH;
        
        if (distance < 60) { // snap zone 60 pixels
          Animated.spring(pan, {
            toValue: { x: targetX, y: targetY },
            useNativeDriver: false,
          }).start();
          onAttempt(id, true, distance);
        } else if (isOverBoard) {
          // Errou, mas soltou em cima do tabuleiro -> volta pra origem e conta erro
          Animated.spring(pan, {
            toValue: { x: initialX, y: initialY },
            useNativeDriver: false,
          }).start();
          onAttempt(id, false, distance);
        } else {
          // Soltou fora do tabuleiro -> só organizando
          const screenW = Dimensions.get('window').width;
          const screenH = Dimensions.get('window').height;
          
          let safeX = absoluteX;
          let safeY = absoluteY;
          
          // Clamp bounds so it doesn't get lost off-screen
          if (safeX < -w/2) safeX = 10;
          if (safeX > screenW - w/2) safeX = screenW - w - 10;
          if (safeY < -h/2) safeY = 10;
          if (safeY > screenH - h/2) safeY = screenH - h - 10;
          
          if (safeX !== absoluteX || safeY !== absoluteY) {
            Animated.spring(pan, {
              toValue: { x: safeX, y: safeY },
              useNativeDriver: false,
            }).start();
          }
        }
      }
    })
  ).current;

  useEffect(() => {
    if (isPlaced) {
      Animated.timing(pan, {
        toValue: { x: targetX, y: targetY },
        duration: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [isPlaced]);

  return (
    <Animated.View
      {...(isPlaced ? {} : panResponder.panHandlers)}
      style={[
        styles.pieceContainer,
        {
          width: svgWidth,
          height: svgHeight,
          transform: pan.getTranslateTransform(),
          zIndex: isPlaced ? 0 : zIndex,
          opacity: isPlaced ? 0.95 : 1, // visual lock cue
        }
      ]}
    >
      <Svg width={svgWidth} height={svgHeight}>
        <Defs>
          <ClipPath id={`clip-${id}`}>
            <Path d={path} />
          </ClipPath>
        </Defs>
        <SvgImage
          href={imageSource}
          x={imageX}
          y={imageY}
          width={fullImageWidth}
          height={fullImageHeight}
          clipPath={`url(#clip-${id})`}
          preserveAspectRatio="xMidYMid slice"
        />
        <Path d={path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pieceContainer: {
    position: 'absolute',
  }
});
