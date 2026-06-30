import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable
} from 'react-native';
import { UserCircle, Lock, Save, AlertTriangle, Trash2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react-native';
import { api } from '../../services/api';

interface ProfileScreenProps {
  onLogout: (dest: 'Login' | 'Register') => void;
  onUserUpdate: (userData: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, onUserUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    crp: '',
    clinicName: '',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    Animated.timing(slideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: false,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: false,
        easing: Easing.in(Easing.ease),
      }).start(() => setShowSuccessToast(false));
    }, 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    Animated.timing(errorSlideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: false,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    setTimeout(() => {
      Animated.timing(errorSlideAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: false,
        easing: Easing.in(Easing.ease),
      }).start(() => setShowErrorToast(false));
    }, 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/my-data');
        if (response.data.success && response.data.data) {
          const u = response.data.data;
          setPersonalData({
            name: u.name || '',
            email: u.email || '',
            crp: u.crp || '',
            clinicName: u.clinicName || '',
          });
        }
      } catch (error) {
        showError('Não foi possível carregar seus dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePersonalChange = (key: string, value: string) => {
    let finalValue = value;
    if (key === 'crp') {
      finalValue = finalValue.replace(/\D/g, '');
      if (finalValue.length > 7) finalValue = finalValue.substring(0, 7);
      if (finalValue.length > 2) finalValue = `${finalValue.substring(0, 2)}/${finalValue.substring(2)}`;
    }
    setPersonalData(prev => ({ ...prev, [key]: finalValue }));
  };

  const handleSavePersonal = async () => {
    if (!personalData.name.trim() || !personalData.email.trim()) {
      showError('Nome e Email são obrigatórios.');
      return;
    }
    try {
      setSavingPersonal(true);
      const response = await api.put('/api/my-data?type=personal', personalData);
      if (response.data.success) {
        onUserUpdate(personalData);
        showToast('Dados atualizados com sucesso!');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao atualizar dados.';
      showError(msg);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdatePassword = () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      showError('Preencha todos os campos de senha.');
      return;
    }
    if (securityData.newPassword === securityData.currentPassword) {
      showError('A nova senha não pode ser igual à atual.');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      showError('A nova senha e a confirmação não conferem.');
      return;
    }
    if (securityData.newPassword.length < 6) {
      showError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setShowPasswordModal(true);
  };

  const confirmUpdatePassword = async () => {
    try {
      setSavingSecurity(true);
      const response = await api.put('/api/my-data?type=security', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });
      if (response.data.success) {
        setShowPasswordModal(false);
        showToast('Senha atualizada! Refaça o login.');
        setTimeout(() => onLogout('Login'), 2000);
      }
    } catch (error: any) {
      setShowPasswordModal(false);
      const msg = error.response?.data?.error || 'Erro ao atualizar senha.';
      showError(msg);
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const response = await api.delete('/api/my-data');
      if (response.data.success) {
        setShowDeleteModal(false);
        onLogout('Register');
      }
    } catch (error: any) {
      setShowDeleteModal(false);
      const msg = error.response?.data?.error || 'Erro ao excluir conta.';
      showError(msg);
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFC857" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={styles.mainTitle}>Meu Perfil</Text>
          <Text style={styles.mainSubtitle}>Gerencie seus dados e acessos da plataforma Teko.</Text>
        </View>
        
        {/* Seção Meus Dados (Amarelo) */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <UserCircle color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleYellow}>
              <UserCircle color="#FFC857" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>Meus Dados</Text>
              <Text style={styles.sectionSubtitle}>Informações de perfil e contato.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={personalData.name}
              onChangeText={(t) => handlePersonalChange('name', t)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Email de Acesso</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={personalData.email}
              onChangeText={(t) => handlePersonalChange('email', t)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>CRP (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="00/00000"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={personalData.crp}
              onChangeText={(t) => handlePersonalChange('crp', t)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Nome da Clínica (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua clínica"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={personalData.clinicName}
              onChangeText={(t) => handlePersonalChange('clinicName', t)}
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButtonYellow} 
            activeOpacity={0.8}
            onPress={handleSavePersonal}
            disabled={savingPersonal}
          >
            {savingPersonal ? <ActivityIndicator color="#181c1c" /> : (
              <>
                <Save color="#181c1c" size={20} />
                <Text style={styles.saveButtonTextYellow}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Seção Segurança (Roxo) */}
        <View style={[styles.card, styles.cardPurple]}>
          <View style={styles.cardBgIcon}>
            <Lock color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePurple}>
              <Lock color="#7B61FF" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>Segurança e Acesso</Text>
              <Text style={styles.sectionSubtitle}>Atualize sua senha para manter sua conta segura.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Senha Atual</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showCurrentPassword}
                value={securityData.currentPassword}
                onChangeText={(t) => setSecurityData(p => ({...p, currentPassword: t}))}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                {showCurrentPassword ? <EyeOff color="rgba(255,255,255,0.5)" size={20} /> : <Eye color="rgba(255,255,255,0.5)" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Nova Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showNewPassword}
                value={securityData.newPassword}
                onChangeText={(t) => setSecurityData(p => ({...p, newPassword: t}))}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                {showNewPassword ? <EyeOff color="rgba(255,255,255,0.5)" size={20} /> : <Eye color="rgba(255,255,255,0.5)" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Confirmar Nova Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showConfirmPassword}
                value={securityData.confirmPassword}
                onChangeText={(t) => setSecurityData(p => ({...p, confirmPassword: t}))}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                {showConfirmPassword ? <EyeOff color="rgba(255,255,255,0.5)" size={20} /> : <Eye color="rgba(255,255,255,0.5)" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButtonPurple} 
            activeOpacity={0.8}
            onPress={handleUpdatePassword}
            disabled={savingSecurity}
          >
            {savingSecurity ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonTextPurple}>Atualizar Senha</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Seção Exclusão (Vermelho) */}
        <View style={[styles.card, styles.cardRed]}>
          <View style={styles.cardBgIcon}>
            <AlertTriangle color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleRed}>
              <AlertTriangle color="#F87171" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={[styles.sectionTitle, { color: '#F87171' }]}>Exclusão de Conta</Text>
              <Text style={styles.sectionSubtitle}>Encerre sua conta permanentemente.</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.deleteButtonRed} 
            activeOpacity={0.8}
            onPress={handleDeleteAccount}
          >
            <Trash2 color="#FFF" size={20} />
            <Text style={styles.deleteButtonTextRed}>Excluir Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal Confirmar Senha */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.modalContainerPurple]}>
            <View style={styles.modalIconBgPurple}>
              <Lock color="#7B61FF" size={32} />
            </View>
            <Text style={styles.modalTitlePurple}>Atenção!</Text>
            <Text style={styles.modalMessage}>
              Você está prestes a atualizar sua senha. Para concluir essa ação com segurança, sua sessão atual será encerrada e você deverá fazer login novamente.
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowPasswordModal(false)}
                disabled={savingSecurity}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>Cancelar</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButtonPurple, pressed && { backgroundColor: '#614BDB' }]}
                onPress={confirmUpdatePassword}
                disabled={savingSecurity}
              >
                {({ pressed }) => savingSecurity ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.modalConfirmTextPurple, pressed && { color: '#FFF' }]}>Confirmar e Sair</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Exclusão de Conta */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.modalContainerRed]}>
            <View style={styles.modalIconBgRed}>
              <AlertTriangle color="#F87171" size={32} />
            </View>
            <Text style={styles.modalTitleRed}>Ação Irreversível</Text>
            <Text style={styles.modalMessage}>
              Você está prestes a excluir permanentemente sua conta. Você perderá todos os acessos, pacientes e histórico.{"\n\n"}Tem certeza absoluta?
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>Cancelar</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
              >
                {({ pressed }) => deletingAccount ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.modalConfirmTextRed, pressed && { color: '#FFF' }]}>Sim, Excluir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color="#FFC857" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Sucesso!</Text>
            <Text style={styles.toastMessage}>{successMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Toast de Erro */}
      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#FF4B4B" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>Ops!</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064b46', // Matching dashboard bg slightly
  },
  container: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  headerArea: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  mainSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 24,
  },
  card: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardPurple: {
    borderColor: 'rgba(123,97,255,0.2)',
  },
  cardRed: {
    borderColor: 'rgba(248,113,113,0.2)',
  },
  cardBgIcon: {
    position: 'absolute',
    top: -20,
    right: -20,
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  iconCircleYellow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 2,
    borderColor: '#FFC857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 2,
    borderColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelYellow: {
    color: '#FFC857',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  labelPurple: {
    color: '#7B61FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#FFF',
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 48,
    height: 52,
    color: '#FFF',
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  saveButtonYellow: {
    flexDirection: 'row',
    backgroundColor: '#FFC857',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonTextYellow: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonPurple: {
    flexDirection: 'row',
    backgroundColor: '#7B61FF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonTextPurple: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonRed: {
    flexDirection: 'row',
    backgroundColor: '#F87171',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  deleteButtonTextRed: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Toasts */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: '#181c1c', 
    borderLeftWidth: 6,
    borderLeftColor: '#FFC857',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20, 
  },
  toastIconBg: {
    width: 50, 
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,200,87,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toastTitle: {
    color: '#FFC857', 
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: '#181c1c', 
    borderLeftWidth: 6,
    borderLeftColor: '#FF4B4B',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20, 
  },
  errorToastIconBg: {
    width: 50, 
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toastTextContainer: {
    flex: 1,
  },
  errorToastTitle: {
    color: '#FF4B4B', 
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },

  /* Modal de Confirmação */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#181c1c',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Modal Roxo (Senha) */
  modalContainerPurple: {
    borderColor: 'rgba(123, 97, 255, 0.2)',
  },
  modalIconBgPurple: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  modalTitlePurple: {
    color: '#7B61FF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalConfirmButtonPurple: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7B61FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextPurple: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Modal Vermelho (Exclusão) */
  modalContainerRed: {
    borderColor: 'rgba(255, 75, 75, 0.2)',
  },
  modalIconBgRed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  modalTitleRed: {
    color: '#F87171',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalConfirmButtonRed: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextRed: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
