export type DifficultyLevel = 'Fácil' | 'Médio';

export interface GameCategory {
  id: string;
  name: string;
  level: DifficultyLevel;
}

export const CATEGORIES: GameCategory[] = [
  // Fácil (5 a 7 anos)
  { id: 'c1', name: 'Animais', level: 'Fácil' },
  { id: 'c2', name: 'Frutas', level: 'Fácil' },
  { id: 'c3', name: 'Cores', level: 'Fácil' },
  { id: 'c4', name: 'Partes do Corpo Humano', level: 'Fácil' },
  { id: 'c5', name: 'Brinquedos', level: 'Fácil' },
  { id: 'c6', name: 'Móveis de Casa', level: 'Fácil' },
  { id: 'c7', name: 'Roupas', level: 'Fácil' },
  { id: 'c8', name: 'Material Escolar', level: 'Fácil' },
  { id: 'c9', name: 'Bichos de Fazenda', level: 'Fácil' },
  
  // Médio (8 a 12 anos)
  { id: 'c10', name: 'Comidas de Aniversário', level: 'Médio' },
  { id: 'c11', name: 'Bichos que Voam', level: 'Médio' },
  { id: 'c12', name: 'Coisas da Cozinha', level: 'Médio' },
  { id: 'c13', name: 'Super-Heróis', level: 'Médio' },
  { id: 'c14', name: 'Desenhos Animados', level: 'Médio' },
  { id: 'c15', name: 'Instrumentos Musicais', level: 'Médio' },
  { id: 'c16', name: 'Lugares para Passear', level: 'Médio' },
  { id: 'c17', name: 'Profissões', level: 'Médio' },
  { id: 'c18', name: 'Coisas Verdes', level: 'Médio' },
  { id: 'c19', name: 'Coisas Redondas', level: 'Médio' }
];

export const getRandomCategory = (level?: DifficultyLevel): GameCategory => {
  const filtered = level ? CATEGORIES.filter(c => c.level === level) : CATEGORIES;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};
