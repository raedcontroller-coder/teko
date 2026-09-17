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
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

interface ProfileScreenProps {
  onLogout: (dest: 'Login' | 'Register') => void;
  onUserUpdate: (userData: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, onUserUpdate }) => {
  const { t } = useTranslation();
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
        showToast(t.profileScreen.saveSuccess);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || t.profileScreen.updatePersonalError;
      showError(msg);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdatePassword = () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      showError(t.profileScreen.fillPasswordFields);
      return;
    }
    if (securityData.newPassword === securityData.currentPassword) {
      showError(t.profileScreen.samePasswordError);
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      showError(t.profileScreen.passwordMismatch);
      return;
    }
    if (securityData.newPassword.length < 6) {
      showError(t.profileScreen.passwordLengthError);
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
        showToast(t.profileScreen.passwordSuccess);
        setTimeout(() => onLogout('Login'), 2000);
      }
    } catch (error: any) {
      setShowPasswordModal(false);
      const msg = error.response?.data?.error || t.profileScreen.passwordUpdateError;
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
      const msg = error.response?.data?.error || t.profileScreen.deleteAccountError;
      showError(msg);
    } finally {
      setDeletingAccount(false);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={styles.mainTitle}>{t.profileScreen.mainTitle}</Text>
          <Text style={styles.mainSubtitle}>{t.profileScreen.mainSubtitle}</Text>
        </View>
        
        {/* Seção Meus Dados */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <UserCircle color={theme.colors.primary} size={110} />
          </View>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleYellow}>
              <UserCircle color={theme.colors.primary} size={28} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>{t.profileScreen.myDetails}</Text>
              <Text style={styles.sectionSubtitle}>{t.profileScreen.myDetailsSub}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.profileScreen.fullName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.namePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={personalData.name}
              onChangeText={(t) => handlePersonalChange('name', t)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.profileScreen.emailAccess}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={personalData.email}
              onChangeText={(t) => handlePersonalChange('email', t)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.profileScreen.crpOptional}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.crpPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={personalData.crp}
              onChangeText={(t) => handlePersonalChange('crp', t)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.profileScreen.clinicOptional}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.clinicPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
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
            {savingPersonal ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Save color="#FFF" size={18} />
                <Text style={styles.saveButtonTextYellow}>{t.profileScreen.saveChanges}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Seção Segurança */}
        <View style={[styles.card, styles.cardPurple]}>
          <View style={styles.cardBgIcon}>
            <Lock color={theme.colors.badgePurpleText} size={110} />
          </View>
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePurple}>
              <Lock color={theme.colors.badgePurpleText} size={28} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>{t.profileScreen.securitySection}</Text>
              <Text style={styles.sectionSubtitle}>{t.profileScreen.securitySub}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>{t.profileScreen.currentPassword}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showCurrentPassword}
                value={securityData.currentPassword}
                onChangeText={(t) => setSecurityData(p => ({...p, currentPassword: t}))}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                {showCurrentPassword ? <EyeOff color={theme.colors.textMuted} size={18} /> : <Eye color={theme.colors.textMuted} size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>{t.profileScreen.newPassword}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showNewPassword}
                value={securityData.newPassword}
                onChangeText={(t) => setSecurityData(p => ({...p, newPassword: t}))}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                {showNewPassword ? <EyeOff color={theme.colors.textMuted} size={18} /> : <Eye color={theme.colors.textMuted} size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>{t.profileScreen.confirmNewPassword}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={securityData.confirmPassword}
                onChangeText={(t) => setSecurityData(p => ({...p, confirmPassword: t}))}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                {showConfirmPassword ? <EyeOff color={theme.colors.textMuted} size={18} /> : <Eye color={theme.colors.textMuted} size={18} />}
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
                <Save color="#FFF" size={18} />
                <Text style={styles.saveButtonTextPurple}>{t.profileScreen.updatePasswordBtn}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Seção Exclusão */}
        <View style={[styles.card, styles.cardRed]}>
          <View style={styles.cardBgIcon}>
            <AlertTriangle color={theme.colors.accentOrange} size={110} />
          </View>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleRed}>
              <AlertTriangle color={theme.colors.accentOrange} size={28} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={[styles.sectionTitle, { color: theme.colors.accentOrange }]}>{t.profileScreen.dangerZone}</Text>
              <Text style={styles.sectionSubtitle}>{t.profileScreen.dangerSub}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.deleteButtonRed} 
            activeOpacity={0.8}
            onPress={handleDeleteAccount}
          >
            <Trash2 color="#FFF" size={18} />
            <Text style={styles.deleteButtonTextRed}>{t.profileScreen.deleteAccountBtn}</Text>
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
            <Text style={styles.modalTitlePurple}>{t.profileScreen.confirmModalTitle}</Text>
            <Text style={styles.modalMessage}>
              {t.profileScreen.confirmModalText}
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowPasswordModal(false)}
                disabled={savingSecurity}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>{t.common.cancel}</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButtonPurple, pressed && { backgroundColor: '#614BDB' }]}
                onPress={confirmUpdatePassword}
                disabled={savingSecurity}
              >
                {({ pressed }) => savingSecurity ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.modalConfirmTextPurple, pressed && { color: '#FFF' }]}>{t.profileScreen.confirmAndLogout}</Text>
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
            <Text style={styles.modalTitleRed}>{t.profileScreen.deleteAccountModalTitle}</Text>
            <Text style={styles.modalMessage}>
              {t.profileScreen.deleteAccountModalMessage}
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>{t.common.cancel}</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
              >
                {({ pressed }) => deletingAccount ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.modalConfirmTextRed, pressed && { color: '#FFF' }]}>{t.common.delete}</Text>
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
            <Text style={styles.toastTitle}>{t.common.success}</Text>
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
    backgroundColor: theme.colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerArea: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 4,
  },
  mainTitle: {
    color: theme.colors.textDark,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  mainSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.subtle,
  },
  cardPurple: {
    borderColor: theme.colors.cardBorder,
  },
  cardRed: {
    borderColor: theme.colors.cardBorder,
  },
  cardBgIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.12,
    pointerEvents: 'none',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  iconCircleYellow: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.purpleSoft,
    borderWidth: 1,
    borderColor: theme.colors.badgePurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRed: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelYellow: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelPurple: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    paddingHorizontal: 16,
    height: 48,
    color: theme.colors.textDark,
    fontSize: 15,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    paddingLeft: 16,
    paddingRight: 48,
    height: 48,
    color: theme.colors.textDark,
    fontSize: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  saveButtonYellow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    ...theme.shadows.subtle,
  },
  saveButtonTextYellow: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButtonPurple: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    ...theme.shadows.subtle,
  },
  saveButtonTextPurple: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButtonRed: {
    flexDirection: 'row',
    backgroundColor: theme.colors.accentOrange,
    height: 50,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  deleteButtonTextRed: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Toasts */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
  },
  toastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTitle: {
    color: theme.colors.primary, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.accentOrange,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
  },
  errorToastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTextContainer: {
    flex: 1,
  },
  errorToastTitle: {
    color: theme.colors.accentOrange, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '500',
  },

  /* Modal de Confirmação */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    ...theme.shadows.floating,
  },
  modalMessage: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: '700',
  },

  /* Modal Roxo (Senha) */
  modalContainerPurple: {
    borderColor: theme.colors.cardBorder,
  },
  modalIconBgPurple: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.badgePurple,
  },
  modalTitlePurple: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalConfirmButtonPurple: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextPurple: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Modal Vermelho (Exclusão) */
  modalContainerRed: {
    borderColor: theme.colors.accentOrange,
  },
  modalIconBgRed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
  },
  modalTitleRed: {
    color: theme.colors.accentOrange,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalConfirmButtonRed: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextRed: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  }
});
