import { Dog, Cat } from 'lucide-react-native';
import { FC } from 'react';
import { SvgProps } from 'react-native-svg';

export type StimulusType = 'go' | 'nogo';

export interface Stimulus {
  id: string;
  type: StimulusType;
  Icon: any; // Utilizando any provisoriamente para evitar erros de tipagem estrita com Lucide icons
  color: string;
}

export const STIMULI: Record<StimulusType, Stimulus> = {
  go: {
    id: 'dog_go',
    type: 'go',
    Icon: Dog,
    color: '#3B82F6', // Azul - Amigável
  },
  nogo: {
    id: 'cat_nogo',
    type: 'nogo',
    Icon: Cat,
    color: '#EF4444', // Vermelho - Cuidado
  }
};
