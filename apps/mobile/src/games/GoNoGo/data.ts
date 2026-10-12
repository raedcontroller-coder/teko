export type StimulusType = 'go' | 'nogo';

export interface Stimulus {
  id: string;
  type: StimulusType;
  emoji: string;
  image: any;
  color: string;
  shadowColor: string;
  name: string;
}

export const STIMULI: Record<StimulusType, Stimulus> = {
  go: {
    id: 'dog_go',
    type: 'go',
    emoji: '🐶',
    image: require('../../../assets/assets_tocarapido/cachorro_toca_rapido.png'),
    color: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#2A9D8F',
    name: 'Cachorro',
  },
  nogo: {
    id: 'cat_nogo',
    type: 'nogo',
    emoji: '🐱',
    image: require('../../../assets/assets_tocarapido/gato_toca_rapido.png'),
    color: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#E07A5F',
    name: 'Gato',
  }
};
