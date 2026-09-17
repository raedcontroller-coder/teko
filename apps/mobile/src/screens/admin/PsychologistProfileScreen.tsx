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
import { theme } from '../../theme/theme';

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
              <ArrowLeft color={pressed ? theme.colors.textMuted : theme.colors.primary} size={24} />
              <Text style={styles.topBarTitle}>Credenciais do Profissional</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BLOCO 1: Dados Pessoais */}
        <View style={styles.sectionContainer}>
          <View style={styles.watermark}>
            <Key color="rgba(8, 77, 72, 0.05)" size={140} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: theme.colors.tealSoft }]}>
              <Key color={theme.colors.primary} size={24} />
            </View>
            <Text style={styles.sectionTitle}>Dados do Profissional</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={t => setFormData(p => ({ ...p, name: t }))}
                placeholder="Ex: Dra. Ana Souza"
                placeholderTextColor={theme.colors.textMuted}
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
                placeholderTextColor={theme.colors.textMuted}
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
                  placeholderTextColor={theme.colors.textMuted}
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
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton, 
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleSaveData}
            disabled={savingData}
          >
            {savingData ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Save color="#FFF" size={20} />
                <Text style={styles.primaryButtonText}>Salvar Dados</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* BLOCO 2: Segurança */}
        <View style={styles.sectionContainer}>
          <View style={styles.watermark}>
            <Lock color="rgba(124, 58, 237, 0.05)" size={140} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: theme.colors.badgePurple }]}>
              <Lock color={theme.colors.badgePurpleText} size={24} />
            </View>
            <Text style={styles.sectionTitle}>Redefinir Senha</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nova Senha</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={passwordData.password}
                onChangeText={t => setPasswordData(p => ({ ...p, password: t }))}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={theme.colors.textMuted}
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
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton, 
              { backgroundColor: theme.colors.badgePurpleText },
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleSavePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Lock color="#FFF" size={20} />
                <Text style={styles.primaryButtonText}>Redefinir Senha</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* BLOCO 3: Zona de Perigo */}
        <View style={[styles.sectionContainer, styles.dangerSection]}>
          <View style={styles.watermark}>
            <Trash2 color="rgba(239, 68, 68, 0.05)" size={140} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#FEE2E2' }]}>
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
            <CheckCircle2 color={theme.colors.primary} size={28} />
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
            <Text style={[styles.toastTitle, { color: '#DC2626' }]}>Erro</Text>
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
              Você está prestes a excluir permanentemente a conta de <Text style={{fontWeight: 'bold', color: theme.colors.textDark}}>{formData.name}</Text>. Ao prosseguir, todos os dados de pacientes e relatórios atrelados a este profissional serão perdidos.
              {'\n\n'}
              <Text style={{fontWeight: 'bold', color: theme.colors.textDark}}>Tem certeza absoluta que deseja continuar?</Text>
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
    backgroundColor: theme.colors.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  sectionContainer: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerSection: {
    borderColor: '#FCA5A5',
    marginBottom: 40,
  },
  watermark: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    height: 52,
  },
  input: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 15,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dangerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    height: 52,
    borderRadius: 12,
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  errorToastContainer: {
    borderColor: '#FCA5A5',
  },
  toastIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.tealSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  errorToastIconBg: {
    backgroundColor: '#FEE2E2',
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  toastMessage: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },

  // Modal (Danger)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 8,
  },
  modalCancelText: {
    color: theme.colors.textDark,
    fontWeight: '600',
    fontSize: 15,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    marginLeft: 8,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

