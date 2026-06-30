import React, { useState, useRef } from 'react';
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
  Pressable
} from 'react-native';
import { ArrowLeft, Baby, User, Shield, CheckCircle2, XCircle } from 'lucide-react-native';
import { api } from '../../services/api';

interface NewPatientScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  adminPsicologoId?: string;
}

export const NewPatientScreen: React.FC<NewPatientScreenProps> = ({ onBack, onSuccess, adminPsicologoId }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
  });
  const [loading, setLoading] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

  const showToast = () => {
    setShowSuccessToast(true);
    Animated.timing(slideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    
    Animated.timing(errorSlideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    setTimeout(() => {
      Animated.timing(errorSlideAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setShowErrorToast(false);
      });
    }, 4000);
  };

  const formatPhone = (text: string) => {
    let onlyNums = text.replace(/\D/g, "");
    if (onlyNums.length > 11) {
      onlyNums = onlyNums.substring(0, 11);
    }
    
    let formatted = onlyNums;
    if (onlyNums.length > 2) {
      formatted = `(${onlyNums.substring(0, 2)}) `;
      if (onlyNums.length > 7) {
        formatted += `${onlyNums.substring(2, 7)}-${onlyNums.substring(7, 11)}`;
      } else {
        formatted += onlyNums.substring(2);
      }
    }
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    setFormData(prev => ({ ...prev, guardianPhone: formatPhone(text) }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.age || !formData.gender || !formData.guardianName.trim() || !formData.guardianEmail.trim() || !formData.guardianPhone) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formData.guardianEmail.includes('@')) {
      showError('Insira um e-mail válido para o responsável.');
      return;
    }

    if (formData.guardianPhone.replace(/\D/g, "").length < 10) {
      showError('O telefone (WhatsApp) deve conter o DDD e o número correto.');
      return;
    }

    try {
      setLoading(true);
      const dataToSubmit = adminPsicologoId ? { ...formData, psicologoId: adminPsicologoId } : formData;
      const response = await api.post('/api/patients', dataToSubmit);
      if (response.data.success) {
        setLoading(false);
        showToast();
        setTimeout(() => {
          onSuccess();
        }, 2500);
      }
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || 'Erro interno ao salvar paciente.';
      showError(errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header Fixo */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Novo Paciente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Seção Criança (Amarelo) */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <Baby color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleYellow}>
              <User color="#FFC857" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>Dados da Criança</Text>
              <Text style={styles.sectionSubtitle}>Informações básicas do paciente.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Nome do Paciente</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: João"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Idade</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 7"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData(prev => ({ ...prev, age: text.replace(/\D/g, '') }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Gênero</Text>
            <View style={styles.pillsContainer}>
              {['Masculino', 'Feminino', 'Prefiro não dizer'].map((gen) => {
                const isSelected = formData.gender === gen;
                return (
                  <TouchableOpacity
                    key={gen}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: gen }))}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{gen}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Seção Responsável (Roxo) */}
        <View style={[styles.card, styles.cardPurple]}>
          <View style={styles.cardBgIcon}>
            <Shield color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePurple}>
              <Shield color="#7B61FF" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>Ficha do Responsável</Text>
              <Text style={styles.sectionSubtitle}>Contato para vínculo do app.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Nome do Responsável</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Maria Silva"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={formData.guardianName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianName: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="maria@email.com"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.guardianEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianEmail: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Telefone (WhatsApp)</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={formData.guardianPhone}
              onChangeText={handlePhoneChange}
            />
          </View>

        </View>

        {/* Botão Salvar (Amarelo) */}
        <Pressable 
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { backgroundColor: '#7B61FF' }
          ]} 
          onPress={handleSave}
          disabled={loading}
        >
          {({ pressed }) => loading ? (
            <ActivityIndicator color="#181c1c" />
          ) : (
            <Text style={[styles.saveButtonText, pressed && { color: '#FFF' }]}>Cadastrar Paciente</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Popup de Sucesso (Topo, grande e escuro) */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color="#FFC857" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Sucesso!</Text>
            <Text style={styles.toastMessage}>Paciente cadastrado. Redirecionando...</Text>
          </View>
        </Animated.View>
      )}

      {/* Popup de Erro (Topo, vermelho) */}
      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#FF4B4B" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>Ops, algo deu errado!</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  topBarTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 48, // Quase a mesma altura do input (52)
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pillSelected: {
    backgroundColor: '#FFC857',
    borderColor: '#FFC857',
  },
  pillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12, // Reduzido
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#181c1c',
  },
  saveButton: {
    backgroundColor: '#FFC857',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
});
