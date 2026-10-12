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
  Pressable,
  Image
} from 'react-native';
import { UserCircle, Lock, Save, AlertTriangle, Trash2, Eye, EyeOff, CheckCircle2, XCircle, Camera, Upload, ShieldCheck, FileText, Download, X, CheckSquare, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';
import { TERMS_SECTIONS_PT, TERMS_SECTIONS_EN } from '../auth/termsData';

interface ProfileScreenProps {
  onLogout: (dest: 'Login' | 'Register') => void;
  onUserUpdate: (userData: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, onUserUpdate }) => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    crp: '',
    clinicName: '',
    avatarUrl: '',
  });

  const [consentData, setConsentData] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

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
            avatarUrl: u.avatarUrl || '',
          });
          if (u.consent) {
            setConsentData(u.consent);
          }
        }
      } catch (error) {
        showError('Não foi possível carregar seus dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        setPersonalData(prev => ({ ...prev, avatarUrl: imageUri }));
      }
    } catch (err) {
      showError('Não foi possível carregar a imagem do celular.');
    }
  };

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

          {/* Avatar Hero Widget (UI/UX Redesign) */}
          <View style={styles.avatarHeroContainer}>
            <TouchableOpacity 
              style={styles.avatarHeroWrapper}
              onPress={pickImageFromDevice}
              activeOpacity={0.85}
            >
              <View style={styles.avatarHeroCircle}>
                <Image 
                  source={personalData.avatarUrl ? { uri: personalData.avatarUrl } : require('../../../assets/icon.jpg')} 
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

            {Boolean(personalData.avatarUrl) && (
              <TouchableOpacity 
                style={styles.avatarRemoveBtn} 
                onPress={() => setPersonalData(prev => ({ ...prev, avatarUrl: '' }))}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarRemoveText}>{t.profileScreen.avatarRemoveText}</Text>
              </TouchableOpacity>
            )}
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
                {showCurrentPassword ? <Eye color={theme.colors.textMuted} size={18} /> : <EyeOff color={theme.colors.textMuted} size={18} />}
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
                {showNewPassword ? <Eye color={theme.colors.textMuted} size={18} /> : <EyeOff color={theme.colors.textMuted} size={18} />}
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
                {showConfirmPassword ? <Eye color={theme.colors.textMuted} size={18} /> : <EyeOff color={theme.colors.textMuted} size={18} />}
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

        {/* Seção: Termo de Consentimento e Ciência Assinado (Leitura Exclusiva) */}
        <View style={[styles.card, styles.cardEmerald]}>
          <View style={styles.cardBgIcon}>
            <ShieldCheck color={theme.colors.primary} size={110} />
          </View>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleEmerald}>
              <ShieldCheck color={theme.colors.primary} size={28} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>{t.profileScreen.signedTermsTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.profileScreen.signedTermsSub}</Text>
            </View>
          </View>

          {/* Badges e Status da Assinatura */}
          <View style={styles.termsStatusContainer}>
            <View style={styles.signedStatusBadge}>
              <CheckCircle2 color={theme.colors.primary} size={14} />
              <Text style={styles.signedStatusBadgeText}>{t.profileScreen.signedTermsStatusSigned}</Text>
            </View>
            <Text style={styles.termsMetaText}>
              {t('profileScreen.signedTermsVersion', { 
                version: consentData?.termVersion || '2.0', 
                lang: (consentData?.termLanguage || 'pt').toUpperCase() 
              })}
            </Text>
          </View>

          {consentData?.acceptedAt && (
            <Text style={styles.termsDateText}>
              {t('profileScreen.signedTermsAcceptedAt', { 
                date: new Date(consentData.acceptedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR') 
              })}
            </Text>
          )}

          {/* Botão de Visualização do Documento Preenchido */}
          <TouchableOpacity 
            style={styles.viewSignedDocumentBtn} 
            activeOpacity={0.85}
            onPress={() => setShowTermsModal(true)}
          >
            <FileText color="#084D48" size={18} />
            <Text style={styles.viewSignedDocumentBtnText}>{t.profileScreen.viewSignedDocumentBtn}</Text>
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

      {/* Modal Visualizador do Termo Assinado (Somente Leitura) */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.signedTermsModalContent}>
            {/* Cabeçalho do Modal */}
            <View style={styles.signedTermsModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.readOnlyBadgeRow}>
                  <ShieldCheck size={14} color="#FFC857" />
                  <Text style={styles.readOnlyBadgeText}>{t.profileScreen.signedTermsStatusSigned}</Text>
                </View>
                <Text style={styles.signedTermsModalHeaderTitle}>{t.profileScreen.signedTermsModalTitle}</Text>
                <Text style={styles.signedTermsModalHeaderSub}>{t.profileScreen.signedTermsModalSub}</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeSignedModalBtn} 
                onPress={() => setShowTermsModal(false)}
              >
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Aviso de Documento Imutável */}
            <View style={styles.readOnlyNoticeBox}>
              <Lock size={15} color={theme.colors.primary} />
              <Text style={styles.readOnlyNoticeText}>
                {t.profileScreen.signedTermsReadOnlyNotice}
              </Text>
            </View>

            {/* Conteúdo do Termo com Marcações */}
            <ScrollView 
              style={styles.signedTermsScrollView}
              contentContainerStyle={styles.signedTermsScrollBody}
              showsVerticalScrollIndicator={true}
            >
              {/* Carimbo Digital de Abertura */}
              <View style={styles.digitalStampCard}>
                <Sparkles size={16} color="#FFC857" style={{ marginBottom: 4 }} />
                <Text style={styles.stampTitle}>{t.profileScreen.stampTitle}</Text>
                <Text style={styles.stampDetails}>
                  {t.profileScreen.stampProfessional}: {personalData.name.toUpperCase()}{'\n'}
                  {t.profileScreen.stampCrp}: {personalData.crp || 'N/A'}{'\n'}
                  {t.profileScreen.stampEmail}: {personalData.email}{'\n'}
                  {t.profileScreen.stampDate}: {consentData?.acceptedAt ? new Date(consentData.acceptedAt).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR') : new Date().toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}{'\n'}
                  {t.profileScreen.stampVersion}: {consentData?.termVersion || '2.0'} {t.profileScreen.stampSections}
                </Text>
              </View>

              {/* Seções Completas do Termo (1 a 15) */}
              {(language === 'en' ? TERMS_SECTIONS_EN : TERMS_SECTIONS_PT).slice(0, 16).map((sec, idx) => (
                <View key={idx} style={styles.docSectionBlock}>
                  <Text style={styles.docSectionTitle}>{sec.title}</Text>
                  <Text style={styles.docSectionContent}>{sec.content}</Text>
                </View>
              ))}

              {/* Seção 16: As 13 Declarações Assinaladas (Imutáveis) */}
              <View style={styles.docChecklistSection}>
                <Text style={styles.docChecklistTitle}>
                  {t.profileScreen.section16SignedTitle}
                </Text>
                <View style={styles.docChecklistContainer}>
                  {(t.auth.termsChecklist || []).map((clauseText: string, cIdx: number) => (
                    <View key={cIdx} style={styles.docCheckItemRow}>
                      <View style={styles.checkedBoxIcon}>
                        <CheckSquare size={18} color="#084D48" strokeWidth={2.6} />
                      </View>
                      <Text style={styles.docCheckItemText}>
                        {clauseText}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Carimbo Digital de Fechamento */}
              <View style={[styles.digitalStampCard, { marginTop: 10 }]}>
                <Text style={styles.stampFooterText}>
                  {t.profileScreen.stampHash}: SHA256-TEKO-{personalData.crp ? personalData.crp.replace(/\D/g, '') : 'PSI'}-{consentData?.id ? consentData.id.substring(0, 8) : t.profileScreen.stampVerified}
                </Text>
              </View>
            </ScrollView>

            {/* Rodapé com Botão de Compartilhar / Download */}
            <View style={styles.signedTermsModalFooter}>
              <TouchableOpacity 
                style={styles.sharePdfBtn}
                activeOpacity={0.85}
                disabled={sharingPdf}
                onPress={async () => {
                  try {
                    setSharingPdf(true);
                    if (consentData?.signedPdfBase64) {
                      const fileUri = `${FileSystem.documentDirectory}Termo_Consentimento_Teko_${personalData.name.replace(/\s+/g, '_')}.pdf`;
                      await FileSystem.writeAsStringAsync(fileUri, consentData.signedPdfBase64, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri, {
                          mimeType: 'application/pdf',
                          dialogTitle: t.profileScreen.shareDialogTitle,
                          UTI: 'com.adobe.pdf',
                        });
                      } else {
                        showToast(t.profileScreen.pdfSavedSuccess);
                      }
                    } else {
                      showToast(t.profileScreen.pdfReadyToast);
                    }
                  } catch (err) {
                    showError(t.profileScreen.pdfExportError);
                  } finally {
                    setSharingPdf(false);
                  }
                }}
              >
                {sharingPdf ? (
                  <ActivityIndicator color="#084D48" size="small" />
                ) : (
                  <>
                    <Download size={18} color="#084D48" />
                    <Text style={styles.sharePdfBtnText}>{t.profileScreen.downloadShareBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  /* Card Emerald & Termo Assinado */
  cardEmerald: {
    borderColor: 'rgba(8, 77, 72, 0.25)',
    backgroundColor: '#FAFDFD',
  },
  iconCircleEmerald: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(8, 77, 72, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  signedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(8, 77, 72, 0.2)',
  },
  signedStatusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  termsMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  termsDateText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  viewSignedDocumentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFC857',
    paddingVertical: 13,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#E6A902',
    ...theme.shadows.subtle,
  },
  viewSignedDocumentBtnText: {
    color: '#084D48',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Modal de Visualização Integral do Termo Assinado */
  signedTermsModalContent: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  signedTermsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  readOnlyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  readOnlyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFC857',
    textTransform: 'uppercase',
  },
  signedTermsModalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
  signedTermsModalHeaderSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeSignedModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3FBFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(8, 77, 72, 0.1)',
  },
  readOnlyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    lineHeight: 16,
  },
  signedTermsScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  signedTermsScrollBody: {
    paddingBottom: 24,
    gap: 14,
  },
  digitalStampCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radii.md,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  stampTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stampDetails: {
    fontSize: 11,
    lineHeight: 18,
    color: theme.colors.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  stampFooterText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  docSectionBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  docSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  docSectionContent: {
    fontSize: 12,
    lineHeight: 19,
    color: '#334155',
  },
  docChecklistSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  docChecklistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  docChecklistContainer: {
    gap: 10,
  },
  docCheckItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkedBoxIcon: {
    marginTop: 1,
  },
  docCheckItemText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: theme.colors.textDark,
    fontWeight: '500',
  },
  signedTermsModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  sharePdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFC857',
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#E6A902',
  },
  sharePdfBtnText: {
    color: '#084D48',
    fontSize: 14,
    fontWeight: '800',
  },
});

