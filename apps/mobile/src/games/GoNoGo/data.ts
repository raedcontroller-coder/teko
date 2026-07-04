export type StimulusType = 'go' | 'nogo';

export interface Stimulus {
  id: string;
  type: StimulusType;
  emoji: string;
  color: string;
  shadowColor: string;
}

export const STIMULI: Record<StimulusType, Stimulus> = {
  go: {
    id: 'dog_go',
    type: 'go',
    emoji: '🐶',
    color: '#E0F2FE', // Fundo azul claro super amigável
    shadowColor: '#3B82F6', // Sombra azul forte
  },
  nogo: {
    id: 'cat_nogo',
    type: 'nogo',
    emoji: '🐱',
    color: '#FEE2E2', // Fundo vermelho claro
    shadowColor: '#EF4444', // Sombra vermelha de alerta
  }
};
