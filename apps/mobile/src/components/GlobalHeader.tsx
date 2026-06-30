import React from 'react';
import { View, Text, StyleSheet, Image, Platform, StatusBar } from 'react-native';

interface GlobalHeaderProps {
  user: any;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ user }) => {
  const roleDisplay = user?.role === 'GLOBAL_ADMIN' ? 'Administrador' :
                      user?.role === 'PSICOLOGO' ? 'Psicólogo' :
                      user?.role === 'FAMILIAR' ? 'Familiar' : 'Usuário';

  const userName = user?.name ? user.name.split(' ')[0] : 'Dr. Teko';

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/icon.jpg')} style={styles.logoImage} resizeMode="cover" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Olá, {userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleDisplay}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 56,
    paddingBottom: 16,
    backgroundColor: '#0D766E', // Cor igual à barra inferior
    borderBottomLeftRadius: 16, // Arredondado igual ao rodapé
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 24, // Contorno totalmente arredondado
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roleBadge: {
    backgroundColor: 'rgba(230,168,0,0.2)', // Fundo amarelo transparente (Teko Yellow)
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  roleText: {
    color: '#E6A800',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
