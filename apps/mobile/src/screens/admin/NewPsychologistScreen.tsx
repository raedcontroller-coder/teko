import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable
} from 'react-native';
import { ArrowLeft, UserCircle, Award, User, Mail, Lock, FileText, Building, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';

import { useTranslation } from '../../i18n';

interface NewPsychologistScreenProps {
  onGoBack: () => void;
}

export const NewPsychologistScreen: React.FC<NewPsychologistScreenProps> = ({ onGoBack }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    crp: '',
    clinicName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Feedback State
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
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

  const handleChange = (key: string, value: string) => {
    let finalValue = value;
    if (key === 'crp') {
      finalValue = finalValue.replace(/\D/g, '');
      if (finalValue.length > 7) finalValue = finalValue.substring(0, 7);
      if (finalValue.length > 2) finalValue = `${finalValue.substring(0, 2)}/${finalValue.substring(2)}`;
    }
    setFormData(prev => ({ ...prev, [key]: finalValue }));
  };

  const handleRegister = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      showError(t.admin.fillRequiredCredentials);
      return;
    }

    if (formData.password.length < 6) {
      showError(t.admin.minPasswordLength);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/admin/psychologists', formData);
      if (response.data.success) {
        showToast(t.admin.registerProfSuccess);
        setTimeout(() => {
          onGoBack();
        }, 1500);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || t.common.saveError;
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Pressable 
            style={styles.backButton}
            onPress={onGoBack}
          >
            <ArrowLeft color={theme.colors.primary} size={20} />
            <Text style={styles.backButtonText}>{t.admin.backToMyProfessionals}</Text>
          </Pressable>

          {/* Seção 1: Credenciais */}
          <View style={styles.section}>
            <View style={styles.watermarkContainer}>
              <UserCircle color={theme.colors.tealSoft} size={140} />
            </View>
            
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainerTeal}>
                <UserCircle color={theme.colors.primary} size={28} />
              </View>
              <View style={styles.sectionHeaderTextContainer}>
                <Text style={styles.sectionTitle}>{t.admin.accessCredentialsTitle}</Text>
                <Text style={styles.sectionSubtitle}>{t.admin.accessCredentialsSub}</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.labelSection}>{t.admin.fullNameLabel}</Text>
              <View style={styles.inputContainer}>
                <User color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.admin.fullNamePlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.name}
                  onChangeText={(val) => handleChange('name', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelSection}>{t.admin.accessEmailLabel}</Text>
              <View style={styles.inputContainer}>
                <Mail color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.admin.accessEmailPlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleChange('email', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelSection}>{t.admin.tempPasswordLabel}</Text>
              <View style={styles.inputContainer}>
                <Lock color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="******"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(val) => handleChange('password', val)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff color={theme.colors.textMuted} size={18} /> : <Eye color={theme.colors.textMuted} size={18} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Seção 2: Informações Profissionais */}
          <View style={styles.section}>
            <View style={styles.watermarkContainer}>
              <Award color={theme.colors.badgePurple} size={140} />
            </View>
            
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainerPurple}>
                <Award color={theme.colors.badgePurpleText} size={28} />
              </View>
              <View style={styles.sectionHeaderTextContainer}>
                <Text style={styles.sectionTitle}>{t.admin.profInfoTitle}</Text>
                <Text style={styles.sectionSubtitle}>{t.admin.profInfoSub}</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.labelSection}>{t.admin.crpOptionalLabel}</Text>
              <View style={styles.inputContainer}>
                <FileText color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="00/00000"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  value={formData.crp}
                  onChangeText={(val) => handleChange('crp', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelSection}>{t.admin.clinicOptionalLabel}</Text>
              <View style={styles.inputContainer}>
                <Building color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.admin.clinicPlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.clinicName}
                  onChangeText={(val) => handleChange('clinicName', val)}
                />
              </View>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.saveButton,
              loading && { opacity: 0.7 },
              pressed && !loading && { backgroundColor: theme.colors.primaryDark }
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Cadastrar Profissional</Text>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toasts Animados */}
      {showSuccessToast && (
        <Animated.View style={[styles.toast, styles.toastSuccess, { top: slideAnim }]}>
          <CheckCircle2 color={theme.colors.primary} size={24} />
          <Text style={styles.toastText}>{successMessage}</Text>
        </Animated.View>
      )}

      {showErrorToast && (
        <Animated.View style={[styles.toast, styles.toastError, { top: errorSlideAnim }]}>
          <AlertTriangle color="#DC2626" size={24} />
          <Text style={[styles.toastText, { color: '#DC2626' }]}>{errorMessage}</Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.card,
  },
  watermarkContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 0,
    pointerEvents: 'none',
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
    zIndex: 1,
  },
  iconContainerTeal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.tealMint,
  },
  iconContainerPurple: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.badgePurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${theme.colors.badgePurpleText}30`,
  },
  sectionHeaderTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelSection: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    height: 48,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...theme.shadows.subtle,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    ...theme.shadows.floating,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
  },
  toastError: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderLeftWidth: 6,
    borderLeftColor: '#DC2626',
  },
  toastText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
});

