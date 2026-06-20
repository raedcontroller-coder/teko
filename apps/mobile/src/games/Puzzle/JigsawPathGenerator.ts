export type EdgeType = -1 | 0 | 1;

export interface PieceEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

/**
 * Gera o path SVG (d attribute) para uma peça clássica de quebra-cabeça.
 * O viewBox precisa acomodar os "tabs" que se estendem para fora da peça.
 * Portanto, o tamanho total da SVG deve ser (w + 2t) por (h + 2t),
 * e a parte reta (plana) da peça fica desenhada a partir de (t, t).
 */
export const getPiecePath = (w: number, h: number, edges: PieceEdges) => {
  const t = Math.min(w, h) * 0.22; // Tamanho do encaixe (tab)

  // (t, t) é o canto superior esquerdo da peça (sem contar abas que saem)
  let d = `M ${t} ${t} `;

  // BORDA SUPERIOR: de (t, t) para (t+w, t)
  if (edges.top === 0) {
    d += `L ${t+w} ${t} `;
  } else {
    const k = edges.top === 1 ? -t : t; // 1 = pra fora, -1 = buraco pra dentro
    d += `L ${t + w*0.35} ${t} C ${t + w*0.32} ${t+k*1.5}, ${t + w*0.68} ${t+k*1.5}, ${t + w*0.65} ${t} L ${t+w} ${t} `;
  }

  // BORDA DIREITA: de (t+w, t) para (t+w, t+h)
  if (edges.right === 0) {
    d += `L ${t+w} ${t+h} `;
  } else {
    const k = edges.right === 1 ? t : -t;
    d += `L ${t+w} ${t + h*0.35} C ${t+w+k*1.5} ${t + h*0.32}, ${t+w+k*1.5} ${t + h*0.68}, ${t+w} ${t + h*0.65} L ${t+w} ${t+h} `;
  }

  // BORDA INFERIOR: de (t+w, t+h) para (t, t+h)
  if (edges.bottom === 0) {
    d += `L ${t} ${t+h} `;
  } else {
    const k = edges.bottom === 1 ? t : -t;
    d += `L ${t + w*0.65} ${t+h} C ${t + w*0.68} ${t+h+k*1.5}, ${t + w*0.32} ${t+h+k*1.5}, ${t + w*0.35} ${t+h} L ${t} ${t+h} `;
  }

  // BORDA ESQUERDA: de (t, t+h) para (t, t)
  if (edges.left === 0) {
    d += `L ${t} ${t} `;
  } else {
    const k = edges.left === 1 ? -t : t;
    d += `L ${t} ${t + h*0.65} C ${t+k*1.5} ${t + h*0.68}, ${t+k*1.5} ${t + h*0.32}, ${t} ${t + h*0.35} L ${t} ${t} `;
  }

  d += 'Z';
  
  return { path: d, tabSize: t };
};
