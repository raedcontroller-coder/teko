export const CHILD_AVATARS: Record<string, any> = {
  'menina_crianca': require('../../assets/elementos_visuais/menina_crianca.png'),
  'menina_2_crianca': require('../../assets/elementos_visuais/menina_2_crianca.png'),
  'menino_crianca': require('../../assets/elementos_visuais/menino_crianca.png'),
  'menino_2_crianca': require('../../assets/elementos_visuais/menino_2_crianca.png'),
};

export interface AvatarOption {
  id: string;
  labelKey: string;
  defaultLabel: string;
  source: any;
}

export const AVAILABLE_AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'menina_crianca', labelKey: 'avatarMenina1', defaultLabel: 'Menina 1', source: require('../../assets/elementos_visuais/menina_crianca.png') },
  { id: 'menina_2_crianca', labelKey: 'avatarMenina2', defaultLabel: 'Menina 2', source: require('../../assets/elementos_visuais/menina_2_crianca.png') },
  { id: 'menino_crianca', labelKey: 'avatarMenino1', defaultLabel: 'Menino 1', source: require('../../assets/elementos_visuais/menino_crianca.png') },
  { id: 'menino_2_crianca', labelKey: 'avatarMenino2', defaultLabel: 'Menino 2', source: require('../../assets/elementos_visuais/menino_2_crianca.png') },
];

export const getChildAvatarSource = (avatarUrl?: string | null, gender?: string | null) => {
  if (avatarUrl && CHILD_AVATARS[avatarUrl]) {
    return CHILD_AVATARS[avatarUrl];
  }
  if (avatarUrl && (avatarUrl.startsWith('data:image') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('file://'))) {
    return { uri: avatarUrl };
  }
  const isGirl = (gender || '').toLowerCase().includes('feminino') || (gender || '').toLowerCase().includes('menina');
  return isGirl ? CHILD_AVATARS['menina_crianca'] : CHILD_AVATARS['menino_crianca'];
};
