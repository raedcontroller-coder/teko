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
  Pressable,
  Modal
} from 'react-native';
import { ArrowLeft, User, Lock, Save, Trash2, CheckCircle2, XCircle, AlertTriangle, Key } from 'lucide-react-native';
import { api } from '../../services/api';

interface PsychologistProfileScreenProps {
  psicologoId: string;
  onGoBack: () => void;
}

export const PsychologistProfileScreen: React.FC<PsychologistProfileScreenProps> = ({ psicologoId, onGoBack }) => {
  const [loading, setLoading] = useState(true);
  const [savingData, setSavingData] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    crp: '',
    clinicName: '',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

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
    const fetchPsi = async () => {
      try {
        const response = await api.get(`/api/admin/psychologists/${psicologoId}`);
        if (response.data.success) {
          setFormData({
            name: response.data.data.name || '',
            email: response.data.data.email || '',
            crp: response.data.data.crp || '',
            clinicName: response.data.data.clinicName || '',
          });
        }
      } catch (err) {
        showError('Erro ao carregar dados do profissional.');
      } finally {
        setLoading(false);
      }
    };
    fetchPsi();
  }, [psicologoId]);

  const handleCrpChange = (text: string) => {
    let value = text.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 7)}`;
    }
    setFormData(prev => ({ ...prev, crp: value }));
  };

  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showError('Nome e e-mail são obrigatórios.');
      return;
    }
    try {
      setSavingData(true);
      const response = await api.put(`/api/admin/psychologists/${psicologoId}?type=data`, formData);
      if (response.data.success) {
        showToast('Dados salvos com sucesso!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao salvar dados.';
      showError(msg);
    } finally {
      setSavingData(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordData.password || passwordData.password !== passwordData.confirmPassword) {
      showError('As senhas não coincidem ou estão vazias.');
      return;
    }
    if (passwordData.password.length < 6) {
      showError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    try {
      setSavingPassword(true);
      const response = await api.put(`/api/admin/psychologists/${psicologoId}?type=password`, { password: passwordData.password });
      if (response.data.success) {
        setPasswordData({ password: '', confirmPassword: '' });
        showToast('Senha atualizada com sucesso!');
      }
    } catch (err: any) {
      showError('Erro ao atualizar senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const response = await api.delete(`/api/admin/psychologists/${psicologoId}`);
      if (response.data.success) {
        setShowDeleteModal(false);
        showToast('Profissional excluído com sucesso!');
        setTimeout(() => {
          onGoBack();
        }, 1500);
      }
    } catch (err) {
      setShowDeleteModal(false);
      showError('Erro ao excluir profissional.');
    } finally {
      setDeleting(false);
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
      {/* Header Fixo */}
      <View style={styles.topBar}>
        <Pressable 
          style={styles.backButtonRow}
          onPress={onGoBack}
        >
          {({ pressed }) => (
            <>
              <ArrowLeft color={pressed ? "#FFC857" : "#FFF"} size={24} />
              <Text style={[styles.topBarTitle, pressed && { color: '#FFC857' }]}>Credenciais do Profissional</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BLOCO 1: Dados Pessoais (Amarelo) */}
        <View style={[styles.sectionContainer, { borderColor: 'rgba(255, 200, 87, 0.2)' }]}>
          <View style={styles.watermark}>
            <Key color="rgba(255, 255, 255, 0.15)" size={140} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(255, 200, 87, 0.1)', borderWidth: 1, borderColor: '#FFC857' }]}>
              <Key color="#FFC857" size={24} />
            </View>
            <Text style={[styles.sectionTitle, { color: '#FFC857' }]}>Credenciais do Profissional</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={t => setFormData(p => ({ ...p, name: t }))}
                placeholder="Ex: Dra. Ana Souza"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={t => setFormData(p => ({ ...p, email: t }))}
                placeholder="Ex: ana@exemplo.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>CRP{'\n'}(Opcional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.crp}
                  onChangeText={handleCrpChange}
                  placeholder="00/00000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                  maxLength={8}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Nome da Clínica (Opcional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.clinicName}
                  onChangeText={t => setFormData(p => ({ ...p, clinicName: t }))}
                  placeholder="Clínica Paz"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton, 
              pressed && { backgroundColor: '#7B61FF' }
            ]}
            onPress={handleSaveData}
            disabled={savingData}
          >
            {({ pressed }) => (
              savingData ? (
                <ActivityIndicator color="#064b46" />
              ) : (
                <>
                  <Save color={pressed ? "#FFF" : "#064b46"} size={20} />
                  <Text style={[styles.primaryButtonText, pressed && { color: '#FFF' }]}>Salvar Dados</Text>
                </>
              )
            )}
          </Pressable>
        </View>

        {/* BLOCO 2: Segurança (Roxo) */}
        <View style={[styles.sectionContainer, { borderColor: 'rgba(123, 97, 255, 0.2)' }]}>
          <View style={styles.watermark}>
            <Lock color="rgba(255, 255, 255, 0.15)" size={140} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(123, 97, 255, 0.1)', borderWidth: 1, borderColor: '#7B61FF' }]}>
              <Lock color="#7B61FF" size={24} />
            </View>
            <Text style={[styles.sectionTitle, { color: '#7B61FF' }]}>Redefinir Senha</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nova Senha</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={passwordData.password}
                onChangeText={t => setPasswordData(p => ({ ...p, password: t }))}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Nova Senha</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={t => setPasswordData(p => ({ ...p, confirmPassword: t }))}
                placeholder="Repita a nova senha"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
              />
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton, 
              { backgroundColor: '#7B61FF' },
              pressed && { backgroundColor: '#FFC857' }
            ]}
            onPress={handleSavePassword}
            disabled={savingPassword}
          >
            {({ pressed }) => (
              savingPassword ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Lock color={pressed ? "#064b46" : "#FFF"} size={20} />
                  <Text style={[styles.primaryButtonText, { color: '#FFF' }, pressed && { color: '#064b46' }]}>Redefinir Senha</Text>
                </>
              )
            )}
          </Pressable>
        </View>

        {/* BLOCO 3: Zona de Perigo */}
        <View style={[styles.sectionContainer, { borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 40 }]}>
          <View style={styles.watermark}>
            <Trash2 color="rgba(255, 255, 255, 0.15)" size={140} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#EF4444' }]}>
              <AlertTriangle color="#EF4444" size={24} />
            </View>
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Exclusão de Conta</Text>
          </View>
          <Text style={styles.dangerText}>
            Remover este profissional e todos os seus dados da plataforma.
          </Text>

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Trash2 color="#FFF" size={20} />
                <Text style={styles.dangerButtonText}>Excluir Profissional</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Popup de Sucesso */}
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

      {/* Popup de Erro */}
      {showErrorToast && (
        <Animated.View style={[styles.toastContainer, styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={[styles.toastIconBg, styles.errorToastIconBg]}>
            <XCircle color="#EF4444" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Erro</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Modal de Exclusão */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBg}>
              <AlertTriangle color="#EF4444" size={32} />
            </View>
            <Text style={styles.modalTitle}>Ação Irreversível</Text>
            <Text style={styles.modalText}>
              Você está prestes a excluir permanentemente a conta de <Text style={{fontWeight: 'bold', color: '#FFF'}}>{formData.name}</Text>. Ao prosseguir, todos os dados de pacientes e relatórios atrelados a este profissional serão perdidos.
              {'\n\n'}
              <Text style={{fontWeight: 'bold', color: '#FFF'}}>Tem certeza absoluta que deseja continuar?</Text>
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.modalConfirmText}>Sim, excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064b46', // body bg
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#064b46',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#084D48',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topBarTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
  },
  sectionContainer: {
    backgroundColor: '#0A5C55',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 56,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#FFC857',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#064b46',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dangerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Toasts
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  errorToastContainer: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  toastIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 200, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  errorToastIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },

  // Modal (Danger)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#084D48',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    marginLeft: 8,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
