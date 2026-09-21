import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing, Dimensions, ScrollView, Pressable, Keyboard } from 'react-native';
import { Plus, Search, X, Trash2, XCircle, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

import { DailyView } from '../../components/agenda/DailyView';
import { WeeklyView } from '../../components/agenda/WeeklyView';
import { MonthlyView } from '../../components/agenda/MonthlyView';

import ColorPicker from 'react-native-wheel-color-picker';

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

import { useTranslation } from '../../i18n';

interface AgendaScreenProps {
  initialOpenCreateModal?: boolean;
  onResetCreateModal?: () => void;
  adminPsicologoId?: string;
  adminPsicologoName?: string;
  onGoBack?: () => void;
}

export function AgendaScreen({ 
  initialOpenCreateModal, 
  onResetCreateModal,
  adminPsicologoId,
  adminPsicologoName,
  onGoBack
}: AgendaScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayNum}`;
  };

  const [viewMode, setViewMode] = useState<'Dia' | 'Semana' | 'Mês'>('Mês');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(true);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAppointments = async () => {
    try {
      const endpoint = adminPsicologoId ? `/api/appointments?psicologoId=${adminPsicologoId}` : '/api/appointments';
      const response = await api.get(endpoint);
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const mapped = response.data.data.map((item: any) => ({
          id: item.id,
          date: item.date,
          time: item.startTime,
          end: item.endTime,
          title: item.title,
          name: item.name,
          type: item.type,
          status: item.status || 'a_confirmar',
          color: item.color || '#10B981',
          patientId: item.patientId,
          notes: item.notes || ''
        }));
        setAppointments(mapped);

        // Extrai as cores de agendamentos cadastrados e inclui nas recentes
        const fetchedColors = mapped.map((item: any) => (item.color || '#10B981').toUpperCase());
        setRecentColors(prev => {
          const combined = [...fetchedColors, ...prev];
          const unique = Array.from(new Set(combined.filter((c: string) => /^#[0-9A-Fa-f]{6}$/.test(c)))).slice(0, 10);
          AsyncStorage.setItem('agenda_recent_colors', JSON.stringify(unique)).catch(e => console.error(e));
          return unique;
        });
      }
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const currentYear = parseInt(selectedDate.split('-')[0]);
    setIsLoadingHolidays(true);
    
    // Busca feriados do ano passado, deste ano e do próximo ano simultaneamente
    Promise.all([
      fetch(`https://brasilapi.com.br/api/feriados/v1/${currentYear - 1}`).then(res => res.json()),
      fetch(`https://brasilapi.com.br/api/feriados/v1/${currentYear}`).then(res => res.json()),
      fetch(`https://brasilapi.com.br/api/feriados/v1/${currentYear + 1}`).then(res => res.json())
    ])
    .then(([dataPrev, dataCurr, dataNext]) => {
      const allHolidays: Holiday[] = [];
      if (Array.isArray(dataPrev)) allHolidays.push(...dataPrev);
      if (Array.isArray(dataCurr)) allHolidays.push(...dataCurr);
      if (Array.isArray(dataNext)) allHolidays.push(...dataNext);
      
      setHolidays(allHolidays);
    })
    .catch(err => console.log('Erro ao buscar feriados:', err))
    .finally(() => setIsLoadingHolidays(false));
  }, []); // Executa uma vez ao montar, carregando 3 anos na memória

  // --- Search State ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = appointments.filter(app => {
    const q = searchQuery.toLowerCase();
    return (app.name || '').toLowerCase().includes(q) || (app.title || '').toLowerCase().includes(q);
  });

  // --- Modal Form State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formType, setFormType] = useState('');
  const [formStatus, setFormStatus] = useState<'a_confirmar' | 'confirmado' | 'concluido' | 'cancelado' | 'falta'>('a_confirmar');
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState('#10B981');
  const [recentColors, setRecentColors] = useState<string[]>(['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6']);

  // Carrega as cores recentes salvas localmente no AsyncStorage
  useEffect(() => {
    if (initialOpenCreateModal) {
      handleOpenCreateModal();
      if (onResetCreateModal) {
        onResetCreateModal();
      }
    }
  }, [initialOpenCreateModal]);

  useEffect(() => {
    const loadRecentColors = async () => {
      try {
        const stored = await AsyncStorage.getItem('agenda_recent_colors');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentColors(parsed);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar cores recentes:', err);
      }
    };
    loadRecentColors();
  }, []);

  const saveRecentColor = (colorToSave: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorToSave)) return;
    const upper = colorToSave.toUpperCase();
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== upper);
      const updated = [upper, ...filtered].slice(0, 10);
      AsyncStorage.setItem('agenda_recent_colors', JSON.stringify(updated)).catch(e => console.error(e));
      return updated;
    });
  };

  const [showClearColorsModal, setShowClearColorsModal] = useState(false);

  const handleClearRecentColors = () => {
    setShowClearColorsModal(true);
  };

  const confirmClearRecentColors = async () => {
    setShowClearColorsModal(false);
    setRecentColors([]);
    await AsyncStorage.removeItem('agenda_recent_colors');
    showSuccess(t.agenda.clearRecentColorsSuccess || 'Paleta de cores recentes limpa!');
  };
  
  // --- Toast State ---
  const [errorSlideAnim] = useState(new Animated.Value(-screenWidth));
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [successSlideAnim] = useState(new Animated.Value(-screenWidth));
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    Animated.timing(successSlideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.2)),
    }).start();

    setTimeout(() => {
      Animated.timing(successSlideAnim, {
        toValue: -screenWidth,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setShowSuccessToast(false);
      });
    }, 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    
    // Anima a entrada vindo da esquerda para a direita (efeito bounce lateral)
    Animated.timing(errorSlideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.2)),
    }).start();

    // Aguarda e anima a saída de volta para a esquerda
    setTimeout(() => {
      Animated.timing(errorSlideAnim, {
        toValue: -screenWidth,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setShowErrorToast(false);
      });
    }, 4000);
  };

  // --- Time Helpers ---
  const handleTimeChange = (text: string, setTime: (val: string) => void, prevVal: string = '') => {
    const isDeleting = text.length < prevVal.length;
    let digits = text.replace(/\D/g, '');

    // Se o valor anterior tinha :00 autopreenchido (ex: 14:00) e o usuário digitou mais um número (ex: 14:003 -> 14003)
    if (!isDeleting && /^(\d{2})00(\d{1,2})$/.test(digits)) {
      digits = digits.replace(/^(\d{2})00(\d{1,2})$/, '$1$2');
    }

    if (digits.length === 0) {
      setTime('');
      return;
    }

    // Validação do Primeiro Dígito da Hora
    const h1 = parseInt(digits[0], 10);
    
    // Se o usuário digitar um número > 2 como primeiro dígito (ex: 9), transforma em 09:00
    if (digits.length === 1 && h1 > 2) {
      setTime(`0${h1}:00`);
      return;
    }

    if (digits.length === 1) {
      setTime(digits);
      return;
    }

    // Trava de horas em no máximo 23 (ex: 28:00 -> 23:00)
    let h2 = parseInt(digits[1], 10);
    let hh = h1 * 10 + h2;
    if (hh > 23) hh = 23;
    const hhStr = String(hh).padStart(2, '0');

    if (digits.length === 2) {
      if (isDeleting) {
        setTime(hhStr);
      } else {
        setTime(`${hhStr}:00`);
      }
      return;
    }

    // Validação de Minutos (00 a 59)
    // O primeiro dígito dos minutos (dígito 3) não pode ser maior que 5 (ex: 23:69 -> 23:59)
    let m1 = parseInt(digits[2], 10);
    if (m1 > 5) m1 = 5;

    if (digits.length === 3) {
      setTime(`${hhStr}:${m1}`);
      return;
    }

    let m2 = parseInt(digits[3], 10);
    let mm = m1 * 10 + m2;
    if (mm > 59) mm = 59;
    const mmStr = String(mm).padStart(2, '0');

    setTime(`${hhStr}:${mmStr}`);
  };

  const handleTimeBlur = (time: string, setTime: (val: string) => void) => {
    if (!time.trim()) return;
    let digits = time.replace(/\D/g, '');
    if (digits.length === 0) return;
    
    if (digits.length === 1) digits = `0${digits}00`;
    else if (digits.length === 2) digits = `${digits}00`;
    else if (digits.length === 3) digits = `${digits}0`;

    let h = parseInt(digits.slice(0, 2), 10);
    let m = parseInt(digits.slice(2, 4), 10);
    
    if (isNaN(h) || h < 0) h = 0;
    if (h > 23) h = 23;
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    
    setTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  // --- Date Helpers ---
  const formatToBR = (isoDate: string) => {
    if(!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatToISO = (brDate: string) => {
    if(!brDate) return '';
    const [d, m, y] = brDate.split('/');
    return `${y}-${m}-${d}`;
  };

  const handleDateChange = (text: string) => {
    let val = text.replace(/\D/g, '');
    if (val.length > 2) val = val.replace(/^(\d{2})(\d)/, '$1/$2');
    if (val.length > 5) val = val.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    setFormDate(val.slice(0, 10));
  };

  // --- Actions ---
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormDate(formatToBR(selectedDate));
    setFormTitle('');
    setFormName('');
    setFormTime('');
    setFormEnd('');
    setFormType('');
    setFormStatus('a_confirmar');
    setFormNotes('');
    setFormColor(recentColors[0] || '#10B981');
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (app: any) => {
    setEditingId(app.id);
    setFormDate(formatToBR(app.date));
    setFormTitle(app.title);
    setFormName(app.name);
    setFormTime(app.time);
    setFormEnd(app.end);
    setFormType(app.type);
    setFormStatus(app.status || 'a_confirmar');
    setFormNotes(app.notes || '');
    setFormColor(app.color || '#10B981');
    setIsModalVisible(true);
  };

  const handleQuickStatusUpdate = async (id: string | number, newStatus: string) => {
    try {
      setIsSaving(true);
      const url = adminPsicologoId ? `/api/appointments/${id}?psicologoId=${adminPsicologoId}` : `/api/appointments/${id}`;
      await api.put(url, { status: newStatus });
      showSuccess(t.agenda.updateSuccess);
      await fetchAppointments();
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      showError(err.response?.data?.error || t.agenda.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      showError(t.agenda.titleRequired);
      return;
    }
    if (!formName.trim()) {
      showError(t.agenda.nameRequired);
      return;
    }
    if (!formDate.trim() || formDate.length !== 10) {
      showError(t.agenda.dateRequired);
      return;
    }
    
    // Validação Lógica de Data
    const dateParts = formDate.split('/');
    if (dateParts.length !== 3) {
      showError(t.agenda.invalidDateFormat);
      return;
    }
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    const isLeap = (year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
    const monthDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (year < 2020 || year > 2040 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) {
       showError(t.agenda.invalidDateValue);
       return;
    }

    if (!formType.trim()) {
      showError(t.agenda.typeRequired);
      return;
    }
    if (!formTime.trim()) {
      showError(t.agenda.startTimeRequired);
      return;
    }
    if (!formEnd.trim()) {
      showError(t.agenda.endTimeRequired);
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formTime)) {
      showError(t.agenda.invalidStartTime);
      return;
    }
    if (!timeRegex.test(formEnd)) {
      showError(t.agenda.invalidEndTime);
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(formColor)) {
      showError(t.agenda.invalidColor);
      return;
    }

    // Validação Lógica de Tempo
    const startMinutes = parseInt(formTime.split(':')[0]) * 60 + parseInt(formTime.split(':')[1]);
    const endMinutes = parseInt(formEnd.split(':')[0]) * 60 + parseInt(formEnd.split(':')[1]);

    if (startMinutes >= endMinutes) {
      showError(t.agenda.timeInconsistency);
      return;
    }

    // Salva e persiste a cor recente utilizada
    saveRecentColor(formColor);

    const finalIsoDate = formatToISO(formDate);

    try {
      setIsSaving(true);
      const payload = {
        date: finalIsoDate,
        startTime: formTime,
        endTime: formEnd,
        title: formTitle.trim(),
        name: formName.trim(),
        type: formType.trim(),
        status: formStatus,
        notes: formNotes.trim(),
        color: formColor,
      };

      if (editingId) {
        const url = adminPsicologoId ? `/api/appointments/${editingId}?psicologoId=${adminPsicologoId}` : `/api/appointments/${editingId}`;
        await api.put(url, payload);
        showSuccess(t.agenda.updateSuccess);
      } else {
        const url = adminPsicologoId ? `/api/appointments?psicologoId=${adminPsicologoId}` : '/api/appointments';
        await api.post(url, payload);
        showSuccess(t.agenda.createSuccess);
      }

      await fetchAppointments();
      setIsModalVisible(false);
    } catch (err: any) {
      console.error("Erro ao salvar agendamento:", err);
      showError(err.response?.data?.error || t.agenda.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  const handleDelete = (id: string | number) => {
    setDeleteConfirmId(id);
  };

  const confirmDeletion = async () => {
    if (deleteConfirmId !== null) {
      try {
        setIsSaving(true);
        const url = adminPsicologoId ? `/api/appointments/${deleteConfirmId}?psicologoId=${adminPsicologoId}` : `/api/appointments/${deleteConfirmId}`;
        await api.delete(url);
        setDeleteConfirmId(null);
        if (isModalVisible) setIsModalVisible(false);
        await fetchAppointments();
        showSuccess(t.agenda.deleteSuccess);
      } catch (err: any) {
        console.error("Erro ao excluir agendamento:", err);
        showError(err.response?.data?.error || t.agenda.deleteError);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    setViewMode('Dia');
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {adminPsicologoId && onGoBack && (
          <TouchableOpacity onPress={onGoBack} style={{ marginRight: 12 }}>
            <ArrowLeft color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        )}
        {isSearching && viewMode !== 'Mês' ? (
          <View style={styles.searchContainer}>
            <TextInput 
               style={styles.searchInput}
               placeholder={t.agenda.searchPlaceholder}
               placeholderTextColor={theme.colors.textMuted}
               value={searchQuery}
               onChangeText={setSearchQuery}
               autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={{ padding: 4 }}>
              <X size={20} color={theme.colors.textDark} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerTitleCol}>
              <Text style={styles.title}>
                {adminPsicologoName ? `Agenda: ${adminPsicologoName}` : t.agenda.title}
              </Text>
              <Text style={styles.headerSubtitle}>
                {`${appointments.length} ${t.agenda.scheduledAppointmentsCount}`}
              </Text>
            </View>
            {viewMode !== 'Mês' && (
              <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearching(true)} activeOpacity={0.75}>
                <Search size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* TOGGLE CONTROLS */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleContainer}>
          {['Mês', 'Semana', 'Dia'].map(mode => (
            <TouchableOpacity 
              key={mode} 
              style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
              onPress={() => {
                if (mode === 'Dia' && viewMode !== 'Dia') {
                  setSelectedDate(getTodayDate());
                }
                if (mode === 'Mês') {
                  setIsSearching(false);
                  setSearchQuery('');
                }
                setViewMode(mode as any);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
                {mode === 'Dia' ? t.agenda.daily : mode === 'Semana' ? t.agenda.weekly : t.agenda.monthly}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DYNAMIC VIEWS */}
      {isLoadingHolidays ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t.agenda.loadingCalendar}</Text>
        </View>
      ) : (
        <>
          {viewMode === 'Dia' && (
            <DailyView 
              selectedDate={selectedDate} 
              appointments={filteredAppointments} 
              holidays={holidays}
              onEdit={handleOpenEditModal} 
              onDelete={handleDelete}
              onStatusChange={handleQuickStatusUpdate}
              onDateChange={setSelectedDate}
            />
          )}
          
          {viewMode === 'Semana' && (
            <WeeklyView 
              currentDate={selectedDate} 
              appointments={filteredAppointments} 
              holidays={holidays}
              onDayPress={handleDayPress}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              onStatusChange={handleQuickStatusUpdate}
            />
          )}

          {viewMode === 'Mês' && (
            <MonthlyView 
              currentDate={selectedDate} 
              appointments={appointments} 
              holidays={holidays}
              onDayPress={handleDayPress}
            />
          )}
        </>
      )}

      {/* FAB - ADD APPOINTMENT */}
      <TouchableOpacity style={[styles.fab, { bottom: 84 + Math.max(insets.bottom, 12) }]} onPress={handleOpenCreateModal}>
        <Plus size={30} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL CRUD */}
      <Modal visible={isModalVisible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { paddingBottom: keyboardHeight > 0 ? 10 : Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? t.agenda.editAppointment : t.agenda.newAppointment}</Text>
              <TouchableOpacity 
                onPress={() => !isSaving && setIsModalVisible(false)} 
                style={[styles.closeBtn, isSaving && { opacity: 0.5 }]}
                disabled={isSaving}
              >
                <X size={24} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled" 
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={[styles.formContainer, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : 30 }]}
              style={{ flexShrink: 1 }}
            >
              <Text style={styles.firstLabel}>{t.agenda.appointmentTitleLabel}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={t.agenda.appointmentTitlePlaceholder} 
                placeholderTextColor={theme.colors.textMuted}
                value={formTitle} 
                onChangeText={setFormTitle} 
                editable={!isSaving}
              />

              <Text style={styles.label}>{t.agenda.patientNameLabel}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={t.agenda.patientNamePlaceholder} 
                placeholderTextColor={theme.colors.textMuted}
                value={formName} 
                onChangeText={setFormName} 
                editable={!isSaving}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t.agenda.dateLabelWithFormat}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="25/12/2026" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formDate} 
                    onChangeText={handleDateChange} 
                    keyboardType="numeric"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t.agenda.typeLabel}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder={t.agenda.typePlaceholder} 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formType} 
                    onChangeText={setFormType} 
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t.agenda.startTimeLabel}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="09:00" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formTime} 
                    onChangeText={(t) => handleTimeChange(t, setFormTime, formTime)} 
                    onBlur={() => handleTimeBlur(formTime, setFormTime)}
                    keyboardType="numeric"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t.agenda.endTimeLabel}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="10:00" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formEnd} 
                    onChangeText={(t) => handleTimeChange(t, setFormEnd, formEnd)} 
                    onBlur={() => handleTimeBlur(formEnd, setFormEnd)}
                    keyboardType="numeric"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <Text style={styles.label}>{t.agenda.statusLabel}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={[
                  styles.statusPillsRow,
                  !editingId && styles.statusPillsRowCentered
                ]}
              >
                {(editingId ? [
                  { id: 'a_confirmar', label: t.agenda.statusAConfirmar, color: '#F59E0B', bgActive: '#FEF3C7', border: '#FCD34D' },
                  { id: 'confirmado', label: t.agenda.statusConfirmado, color: '#10B981', bgActive: '#D1FAE5', border: '#6EE7B7' },
                  { id: 'concluido', label: t.agenda.statusConcluido, color: '#0284C7', bgActive: '#E0F2FE', border: '#7DD3FC' },
                  { id: 'cancelado', label: t.agenda.statusCancelado, color: '#EF4444', bgActive: '#FEE2E2', border: '#FCA5A5' },
                  { id: 'falta', label: t.agenda.statusFalta, color: '#6B7280', bgActive: '#F3F4F6', border: '#D1D5DB' },
                ] : [
                  { id: 'a_confirmar', label: t.agenda.statusAConfirmar, color: '#F59E0B', bgActive: '#FEF3C7', border: '#FCD34D' },
                  { id: 'confirmado', label: t.agenda.statusConfirmado, color: '#10B981', bgActive: '#D1FAE5', border: '#6EE7B7' },
                ]).map(item => {
                  const isActive = formStatus === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.statusFormPill,
                        { borderColor: isActive ? item.color : theme.colors.cardBorder },
                        isActive && { backgroundColor: item.bgActive }
                      ]}
                      onPress={() => !isSaving && setFormStatus(item.id as any)}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.statusFormPillDot, { backgroundColor: item.color }]} />
                      <Text style={[
                        styles.statusFormPillText,
                        { color: isActive ? item.color : theme.colors.textDark, fontWeight: isActive ? '800' : '600' }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>{t.agenda.notesLabel}</Text>
              <TextInput 
                style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]} 
                placeholder={t.agenda.notesPlaceholder} 
                placeholderTextColor={theme.colors.textMuted}
                value={formNotes} 
                onChangeText={setFormNotes} 
                multiline
                numberOfLines={3}
                editable={!isSaving}
              />

              <Text style={styles.label}>{t.agenda.highlightColorLabel}</Text>
              <View style={styles.colorPickerContainer}>
                <TouchableOpacity 
                  style={[styles.colorPreview, { backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(formColor) ? formColor : 'transparent' }]} 
                  onPress={() => !isSaving && setIsColorPickerVisible(true)}
                  disabled={isSaving}
                />
                <TextInput 
                  style={styles.hexInput}
                  value={formColor}
                  onChangeText={setFormColor}
                  maxLength={7}
                  autoCapitalize="characters"
                  editable={!isSaving}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
                <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>{t.agenda.recentColorsLabel}</Text>
                {recentColors.length > 0 && (
                  <TouchableOpacity 
                    onPress={handleClearRecentColors} 
                    disabled={isSaving}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.recentColorsRow}
              >
                {recentColors.length === 0 ? (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontStyle: 'italic', paddingVertical: 4 }}>
                    {t.common.none || 'Nenhuma cor recente'}
                  </Text>
                ) : (
                  recentColors.map(color => (
                    <TouchableOpacity 
                      key={color} 
                      style={[
                        styles.colorBubble, 
                        { backgroundColor: color }, 
                        formColor.toUpperCase() === color.toUpperCase() && styles.colorBubbleSelected
                      ]} 
                      onPress={() => !isSaving && setFormColor(color)}
                      disabled={isSaving}
                    />
                  ))
                )}
              </ScrollView>

            </ScrollView>

            <View style={styles.modalFooter}>
              {editingId !== null && (
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDelete(editingId)}
                  disabled={isSaving}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#181c1c" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.common.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* COLOR PICKER MODAL */}
      <Modal visible={isColorPickerVisible} animationType="fade" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <TouchableOpacity 
              style={styles.pickerCloseBtn}
              onPress={() => setIsColorPickerVisible(false)}
            >
              <X color="rgba(255,255,255,0.6)" size={24} />
            </TouchableOpacity>

            <Text style={styles.pickerTitle}>{t.agenda.chooseColor}</Text>
            
            <View style={{ height: 300, width: '100%', marginBottom: 24 }}>
              <ColorPicker
                color={formColor}
                onColorChangeComplete={(color) => setFormColor(color.toUpperCase())}
                thumbSize={30}
                sliderSize={30}
                noSnap={true}
                row={false}
              />
            </View>

            <TouchableOpacity 
              style={styles.pickerSaveBtn} 
              onPress={() => {
                saveRecentColor(formColor);
                setIsColorPickerVisible(false);
              }}
            >
              <Text style={styles.pickerSaveText}>{t.agenda.confirmColor}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal visible={deleteConfirmId !== null} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContainer, styles.deleteModalContainerRed]}>
            <View style={styles.deleteModalIconBgRed}>
              <Trash2 color="#FF4B4B" size={32} />
            </View>
            <Text style={styles.deleteModalTitleRed}>{t.agenda.deleteConfirmTitle}</Text>
            <Text style={styles.deleteModalMessage}>
              {t.agenda.deleteConfirmText}
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable 
                style={({ pressed }) => [styles.deleteModalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setDeleteConfirmId(null)}
              >
                {({ pressed }) => (
                  <Text style={[styles.deleteModalCancelText, pressed && { color: '#FFF' }]}>{t.common.cancel}</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.deleteModalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmDeletion}
              >
                {({ pressed }) => (
                  <Text style={[styles.deleteModalConfirmTextRed, pressed && { color: '#FFF' }]}>{t.common.delete}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CLEAR RECENT COLORS CONFIRMATION MODAL TEKO STYLE */}
      <Modal visible={showClearColorsModal} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContainer, styles.deleteModalContainerRed]}>
            <View style={styles.deleteModalIconBgRed}>
              <Trash2 color="#FF4B4B" size={32} />
            </View>
            <Text style={styles.deleteModalTitleRed}>{t.agenda.clearRecentColorsTitle || 'Limpar Cores Recentes'}</Text>
            <Text style={styles.deleteModalMessage}>
              {t.agenda.clearRecentColorsConfirm || 'Deseja limpar todas as paletas de cores recentes?'}
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable 
                style={({ pressed }) => [styles.deleteModalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowClearColorsModal(false)}
              >
                {({ pressed }) => (
                  <Text style={[styles.deleteModalCancelText, pressed && { color: '#FFF' }]}>{t.common.cancel}</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.deleteModalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmClearRecentColors}
              >
                {({ pressed }) => (
                  <Text style={[styles.deleteModalConfirmTextRed, pressed && { color: '#FFF' }]}>{t.common.delete || 'Limpar'}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* TOAST NOTIFICATIONS TEKO STYLE */}
      {showSuccessToast && (
        <Animated.View style={[styles.successToastContainer, { transform: [{ translateX: successSlideAnim }] }]}>
          <View style={styles.successToastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.successToastTitle}>{t.common.success}</Text>
            <Text style={styles.toastMessage}>{successMessage}</Text>
          </View>
        </Animated.View>
      )}

      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateX: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#FF4B4B" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>{t.common.error}</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitleCol: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.textDark, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '600', marginTop: 2 },
  iconBtn: { width: 44, height: 44, backgroundColor: theme.colors.tealSoft, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${theme.colors.primary}25` },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: theme.colors.textDark, fontSize: 15, paddingVertical: 10, paddingRight: 8 },
  toggleCard: { paddingHorizontal: 20, marginBottom: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.colors.cardBg, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 4, ...theme.shadows.subtle },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  toggleBtnActive: { backgroundColor: theme.colors.primary, ...theme.shadows.subtle },
  toggleText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: '#FFFFFF', fontWeight: '800' },

  statusPillsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statusPillsRowCentered: { flexGrow: 1, justifyContent: 'center' },
  statusFormPill: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: theme.radii.full, 
    borderWidth: 1.5, 
    backgroundColor: '#FFFFFF',
    ...theme.shadows.subtle,
  },
  statusFormPillDot: { width: 8, height: 8, borderRadius: 4 },
  statusFormPillText: { fontSize: 13 },

  fab: { position: 'absolute', bottom: 130, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', ...theme.shadows.floating, zIndex: 10 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: theme.colors.cardBg, 
    borderTopLeftRadius: theme.radii.xl, 
    borderTopRightRadius: theme.radii.xl, 
    maxHeight: Dimensions.get('window').height * 0.85, 
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderWidth: 1, 
    borderColor: theme.colors.cardBorder 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textDark },
  closeBtn: { padding: 4 },
  formContainer: { paddingTop: 4, paddingBottom: 20 },
  firstLabel: { fontSize: 13, color: theme.colors.textDark, marginTop: 4, marginBottom: 6, fontWeight: '700' },
  label: { fontSize: 13, color: theme.colors.textDark, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: '#FFFFFF', borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 14, marginBottom: 14, fontSize: 15, color: theme.colors.textDark },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder, alignItems: 'center' },
  saveBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: theme.radii.md, flex: 1, alignItems: 'center', marginLeft: 12, ...theme.shadows.subtle },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: { padding: 14, backgroundColor: 'rgba(224, 122, 95, 0.15)', borderRadius: theme.radii.md, alignItems: 'center', justifyContent: 'center' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.textMuted, marginTop: 14, fontSize: 14, fontWeight: '600' },

  // Toast Styles
  successToastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 16, left: 16, backgroundColor: theme.colors.cardBg, borderLeftWidth: 6, borderLeftColor: theme.colors.primary, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: theme.radii.md, flexDirection: 'row', alignItems: 'center', padding: 16, ...theme.shadows.floating, zIndex: 99999 },
  successToastIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${theme.colors.primary}18`, borderWidth: 1, borderColor: `${theme.colors.primary}35`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successToastTitle: { color: theme.colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 2 },

  errorToastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 16, left: 16, backgroundColor: theme.colors.cardBg, borderLeftWidth: 6, borderLeftColor: theme.colors.accentOrange, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: theme.radii.md, flexDirection: 'row', alignItems: 'center', padding: 16, ...theme.shadows.floating, zIndex: 99999 },
  errorToastIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(224, 122, 95, 0.15)', borderWidth: 1, borderColor: 'rgba(224, 122, 95, 0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  toastTextContainer: { flex: 1 },
  errorToastTitle: { color: theme.colors.accentOrange, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  toastMessage: { color: theme.colors.textDark, fontSize: 13, fontWeight: '500' },

  // Color Picker
  colorPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 8, marginBottom: 14 },
  colorPreview: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.cardBorder, marginRight: 10 },
  hexInput: { flex: 1, color: theme.colors.textDark, fontSize: 15, fontWeight: '700' },
  recentColorsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  colorBubble: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorBubbleSelected: { borderColor: theme.colors.primary },

  // Color Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerContent: { backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.lg, padding: 20, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder, position: 'relative' },
  pickerCloseBtn: { position: 'absolute', top: 16, left: 16, padding: 4, zIndex: 10 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textDark, marginBottom: 20, marginTop: 4 },
  pickerSaveBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: theme.radii.md, width: '100%', alignItems: 'center' },
  pickerSaveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Delete Confirmation Modal
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  deleteModalContainer: { width: '100%', backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.lg, padding: 24, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center', ...theme.shadows.floating },
  deleteModalContainerRed: { borderColor: theme.colors.accentOrange },
  deleteModalIconBgRed: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(224, 122, 95, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(224, 122, 95, 0.3)' },
  deleteModalTitleRed: { color: theme.colors.accentOrange, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  deleteModalMessage: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  deleteModalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  deleteModalCancelButton: { flex: 1, height: 48, borderRadius: theme.radii.md, backgroundColor: theme.colors.tealSoft, borderWidth: 1, borderColor: theme.colors.tealMint, alignItems: 'center', justifyContent: 'center' },
  deleteModalCancelText: { color: theme.colors.textDark, fontSize: 15, fontWeight: '700' },
  deleteModalConfirmButtonRed: { flex: 1, height: 48, borderRadius: theme.radii.md, backgroundColor: theme.colors.accentOrange, alignItems: 'center', justifyContent: 'center' },
  deleteModalConfirmTextRed: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

