export type DifficultyLevel = 'Simples' | 'Médio' | 'Complexo';

export interface GameCategory {
  id: string;
  name: string;
  level: DifficultyLevel;
}

export const CATEGORIES: GameCategory[] = [
  // Simples (Níveis 1-6)
  { id: 'c1', name: 'Cores', level: 'Simples' },
  { id: 'c2', name: 'Animais', level: 'Simples' },
  { id: 'c3', name: 'Frutas', level: 'Simples' },
  { id: 'c4', name: 'Doces', level: 'Simples' },
  { id: 'c5', name: 'Brinquedos', level: 'Simples' },
  { id: 'c6', name: 'Bebidas', level: 'Simples' },
  { id: 'c7', name: 'Brincadeiras', level: 'Simples' },
  { id: 'c8', name: 'Roupas', level: 'Simples' },
  { id: 'c9', name: 'Partes do Corpo Humano', level: 'Simples' },
  { id: 'c10', name: 'Bichos de Fazenda', level: 'Simples' },
  
  // Médio (Níveis 7-14)
  { id: 'c11', name: 'Alimentos Saudáveis', level: 'Médio' },
  { id: 'c12', name: 'Esportes', level: 'Médio' },
  { id: 'c13', name: 'Veículos', level: 'Médio' },
  { id: 'c14', name: 'Material Escolar', level: 'Médio' },
  { id: 'c15', name: 'Móveis de Casa', level: 'Médio' },
  { id: 'c16', name: 'Coisas da Cozinha', level: 'Médio' },
  { id: 'c17', name: 'Super-Heróis', level: 'Médio' },
  { id: 'c18', name: 'Desenhos Animados', level: 'Médio' },
  { id: 'c19', name: 'Lugares para Passear', level: 'Médio' },
  { id: 'c20', name: 'Comidas de Aniversário', level: 'Médio' },

  // Complexo (Níveis 15+)
  { id: 'c21', name: 'Coisas do céu', level: 'Complexo' },
  { id: 'c22', name: 'Bichos que Voam', level: 'Complexo' },
  { id: 'c23', name: 'Instrumentos Musicais', level: 'Complexo' },
  { id: 'c24', name: 'Profissões', level: 'Complexo' },
  { id: 'c25', name: 'Coisas Verdes', level: 'Complexo' },
  { id: 'c26', name: 'Coisas Redondas', level: 'Complexo' }
];

export const getDifficultyForLevel = (levelScore: number): DifficultyLevel => {
  if (levelScore <= 6) return 'Simples';
  if (levelScore <= 14) return 'Médio';
  return 'Complexo';
};

export const getRandomCategory = (levelScore: number = 1): GameCategory => {
  const targetDifficulty = getDifficultyForLevel(levelScore);
  const filtered = CATEGORIES.filter(c => c.level === targetDifficulty);
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};
