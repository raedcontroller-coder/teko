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

interface NewPsychologistScreenProps {
  onGoBack: () => void;
}

export const NewPsychologistScreen: React.FC<NewPsychologistScreenProps> = ({ onGoBack }) => {
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
      showError('Preencha todos os campos obrigatórios em Credenciais.');
      return;
    }

    if (formData.password.length < 6) {
      showError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/admin/psychologists', formData);
      if (response.data.success) {
        showToast('Profissional cadastrado com sucesso!');
        setTimeout(() => {
          onGoBack();
        }, 1500);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao cadastrar profissional.';
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
            style={({ pressed }) => [
              styles.backButton,
            ]}
            onPress={onGoBack}
          >
            {({ pressed }) => (
              <>
                <ArrowLeft color={pressed ? "#FFC857" : "#FFF"} size={24} />
                <Text style={[styles.backButtonText, pressed && { color: '#FFC857' }]}>Voltar para Meus profissionais</Text>
              </>
            )}
          </Pressable>

          {/* Seção 1: Credenciais */}
          <View style={styles.section}>
            <View style={styles.watermarkContainer}>
              <UserCircle color="rgba(255,255,255,0.07)" size={140} />
            </View>
            
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainerYellow}>
                <UserCircle color="#FFC857" size={48} />
              </View>
              <View style={styles.sectionHeaderTextContainer}>
                <Text style={styles.sectionTitle}>Credenciais de Acesso</Text>
                <Text style={styles.sectionSubtitle}>Defina o nome, e-mail e a senha temporária do profissional.</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.labelYellow}>Nome Completo *</Text>
              <View style={styles.inputContainerYellow}>
                <User color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Dra. Ana Souza"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={formData.name}
                  onChangeText={(val) => handleChange('name', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelYellow}>E-mail de Acesso *</Text>
              <View style={styles.inputContainerYellow}>
                <Mail color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ana@clinica.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleChange('email', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelYellow}>Senha Temporária *</Text>
              <View style={styles.inputContainerYellow}>
                <Lock color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="******"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(val) => handleChange('password', val)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff color="rgba(255,255,255,0.5)" size={20} /> : <Eye color="rgba(255,255,255,0.5)" size={20} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Seção 2: Informações Profissionais */}
          <View style={styles.section}>
            <View style={styles.watermarkContainer}>
              <Award color="rgba(255,255,255,0.07)" size={140} />
            </View>
            
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainerPurple}>
                <Award color="#7B61FF" size={48} />
              </View>
              <View style={styles.sectionHeaderTextContainer}>
                <Text style={styles.sectionTitle}>Informações Profissionais</Text>
                <Text style={styles.sectionSubtitle}>Dados adicionais para identificação (Opcionais).</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.labelPurple}>CRP (Opcional)</Text>
              <View style={styles.inputContainerPurple}>
                <FileText color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="00/00000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                  value={formData.crp}
                  onChangeText={(val) => handleChange('crp', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelPurple}>Nome da Clínica (Opcional)</Text>
              <View style={styles.inputContainerPurple}>
                <Building color="rgba(255,255,255,0.4)" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Clínica Evoluir"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={formData.clinicName}
                  onChangeText={(val) => handleChange('clinicName', val)}
                />
              </View>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.saveButton,
              (loading) && { opacity: 0.7 },
              pressed && !loading && { backgroundColor: '#7B61FF' }
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {({ pressed }) => (
              loading ? (
                <ActivityIndicator color="#084D48" />
              ) : (
                <Text style={[styles.saveButtonText, pressed && !loading && { color: '#FFF' }]}>Cadastrar Profissional</Text>
              )
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toasts Animados */}
      {showSuccessToast && (
        <Animated.View style={[styles.toast, styles.toastSuccess, { top: slideAnim }]}>
          <CheckCircle2 color="#FFF" size={24} />
          <Text style={styles.toastText}>{successMessage}</Text>
        </Animated.View>
      )}

      {showErrorToast && (
        <Animated.View style={[styles.toast, styles.toastError, { top: errorSlideAnim }]}>
          <AlertTriangle color="#FFF" size={24} />
          <Text style={styles.toastText}>{errorMessage}</Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 0,
    pointerEvents: 'none',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
    zIndex: 1,
  },
  iconContainerYellow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,246,227,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFC857',
  },
  iconContainerPurple: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,246,227,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7B61FF',
  },
  sectionHeaderTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
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
  inputContainerYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
  },
  inputContainerPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FFC857',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#084D48',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
});
