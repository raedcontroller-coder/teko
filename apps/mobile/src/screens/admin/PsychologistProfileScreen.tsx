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
  Modal,
  Image
} from 'react-native';
import { ArrowLeft, User, Lock, Save, Trash2, CheckCircle2, XCircle, AlertTriangle, Key, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

interface PsychologistProfileScreenProps {
  psicologoId: string;
  onGoBack: () => void;
}

export const PsychologistProfileScreen: React.FC<PsychologistProfileScreenProps> = ({ psicologoId, onGoBack }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [savingData, setSavingData] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    crp: '',
    clinicName: '',
    avatarUrl: '',
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
            avatarUrl: response.data.data.avatarUrl || '',
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

  const pickImageFromDevice = async () => {
    try {
      if (ImagePicker.requestMediaLibraryPermissionsAsync) {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult && !permissionResult.granted) {
          showError('Permissão para acessar as fotos do celular é necessária.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setFormData(prev => ({ ...prev, avatarUrl: imageUri }));
      }
    } catch (err) {
      showError('Não foi possível carregar a imagem do celular.');
    }
  };

  const handleCrpChange = (text: string) => {
    let value = text.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 7)}`;
    }
    setFormData(prev => ({ ...prev, crp: value }));
  };

  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showError(t.admin.nameEmailRequired);
      return;
    }
    try {
      setSavingData(true);
      const response = await api.put(`/api/admin/psychologists/${psicologoId}?type=data`, formData);
      if (response.data.success) {
        showToast(t.admin.saveDataSuccess);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || t.common.saveError;
      showError(msg);
    } finally {
      setSavingData(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordData.password || passwordData.password !== passwordData.confirmPassword) {
      showError(t.admin.passwordsMismatchOrEmpty);
      return;
    }
    if (passwordData.password.length < 6) {
      showError(t.admin.minPasswordLength);
      return;
    }
    try {
      setSavingPassword(true);
      const response = await api.put(`/api/admin/psychologists/${psicologoId}?type=password`, { password: passwordData.password });
      if (response.data.success) {
        setPasswordData({ password: '', confirmPassword: '' });
        showToast(t.admin.updatePasswordSuccess);
      }
    } catch (err: any) {
      showError(t.profileScreen.passwordUpdateError);
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
        showToast(t.admin.deleteProfSuccess);
        setTimeout(() => {
          onGoBack();
        }, 1500);
      }
    } catch (err) {
      setShowDeleteModal(false);
      showError(t.profileScreen.deleteAccountError);
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
              <Text style={styles.topBarTitle}>{t.admin.credentialsTitle}</Text>
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
            <Text style={styles.sectionTitle}>{t.admin.credentialsTitle}</Text>
          </View>

          {/* Avatar Hero Widget (Administrador pode alterar a foto do profissional) */}
          <View style={styles.avatarHeroContainer}>
            <TouchableOpacity 
              style={styles.avatarHeroWrapper}
              onPress={pickImageFromDevice}
              activeOpacity={0.85}
            >
              <View style={styles.avatarHeroCircle}>
                <Image 
                  source={formData.avatarUrl ? { uri: formData.avatarUrl } : require('../../../assets/icon.jpg')} 
                  style={styles.avatarHeroImage}
                  resizeMode="cover"
                />
              </View>
              {/* Badge Flutuante de Câmera */}
              <View style={styles.avatarHeroBadge}>
                <Camera size={16} color="#FFF" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarHeroTitle}>{t.profileScreen.photoTitle}</Text>
            <Text style={styles.avatarHeroSub}>{t.profileScreen.avatarHeroSub}</Text>

            {Boolean(formData.avatarUrl) && (
              <TouchableOpacity 
                style={styles.avatarRemoveBtn} 
                onPress={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarRemoveText}>{t.profileScreen.avatarRemoveText}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.admin.fullNameLabel.replace(' *', '')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={t => setFormData(p => ({ ...p, name: t }))}
                placeholder={t.admin.fullNamePlaceholder}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.profileScreen.email}</Text>
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
              <Text style={styles.label}>{t.admin.crpOptionalLabel}</Text>
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
              <Text style={styles.label}>{t.admin.clinicOptionalLabel}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.clinicName}
                  onChangeText={t => setFormData(p => ({ ...p, clinicName: t }))}
                  placeholder={t.admin.clinicPlaceholder}
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
                <Text style={styles.primaryButtonText}>{t.admin.saveDataBtn}</Text>
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
            <Text style={styles.sectionTitle}>{t.admin.resetPasswordTitle}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.admin.newPasswordLabel}</Text>
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
            <Text style={styles.label}>{t.admin.confirmNewPasswordLabel}</Text>
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
                <Text style={styles.primaryButtonText}>{t.admin.resetPasswordTitle}</Text>
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
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>{t.admin.dangerZoneTitle}</Text>
          </View>
          <Text style={styles.dangerText}>
            {t.admin.deleteWarningText}
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
                <Text style={styles.dangerButtonText}>{t.admin.deleteAccountBtn}</Text>
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
            <Text style={styles.toastTitle}>{t.common.success}</Text>
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
            <Text style={[styles.toastTitle, { color: '#DC2626' }]}>{t.common.error}</Text>
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
            <Text style={styles.modalTitle}>{t.admin.deleteConfirmModalTitle}</Text>
            <Text style={styles.modalText}>
              {t('admin.deleteConfirmModalMsg', { name: formData.name })}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.modalConfirmText}>{t.admin.yesDeleteBtn}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 130,
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
  /* Avatar Hero Widget */
  avatarHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  avatarHeroWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarHeroCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    overflow: 'hidden',
    backgroundColor: theme.colors.tealSoft,
    ...theme.shadows.card,
  },
  avatarHeroImage: {
    width: '100%',
    height: '100%',
  },
  avatarHeroBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...theme.shadows.subtle,
  },
  avatarHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textDark,
  },
  avatarHeroSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  avatarRemoveBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  avatarRemoveText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accentOrange,
    textDecorationLine: 'underline',
  },
});

