import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing, Dimensions, ScrollView, Pressable } from 'react-native';
import { Plus, Search, X, Trash2, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

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

export function AgendaScreen() {
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
      const response = await api.get('/api/appointments');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const mapped = response.data.data.map((item: any) => ({
          id: item.id,
          date: item.date,
          time: item.startTime,
          end: item.endTime,
          title: item.title,
          name: item.name,
          type: item.type,
          status: item.status || 'confirmado',
          color: item.color || '#10B981',
          patientId: item.patientId
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
  const [formColor, setFormColor] = useState('#10B981');
  const [recentColors, setRecentColors] = useState<string[]>(['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6']);

  // Carrega as cores recentes salvas localmente no AsyncStorage
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
  
  // --- Toast State ---
  const [errorSlideAnim] = useState(new Animated.Value(-screenWidth));
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    setFormColor(app.color || '#10B981');
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      showError('Por favor, informe o título do agendamento.');
      return;
    }
    if (!formName.trim()) {
      showError('Por favor, informe o nome do paciente.');
      return;
    }
    if (!formDate.trim() || formDate.length !== 10) {
      showError('Preencha a data completa no formato DD/MM/AAAA.');
      return;
    }
    
    // Validação Lógica de Data
    const dateParts = formDate.split('/');
    if (dateParts.length !== 3) {
      showError('Formato de data inválido. Use DD/MM/AAAA.');
      return;
    }
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    const isLeap = (year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
    const monthDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (year < 2020 || year > 2040 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) {
       showError('Data inválida. O dia não existe nesse mês ou o ano é absurdo.');
       return;
    }

    if (!formType.trim()) {
      showError('O campo "Tipo" é obrigatório. (Ex: Avaliação, Sessão, etc).');
      return;
    }
    if (!formTime.trim()) {
      showError('Defina o horário de início da consulta.');
      return;
    }
    if (!formEnd.trim()) {
      showError('Defina o horário de término da consulta.');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formTime)) {
      showError('Horário de início inválido. O horário deve estar entre 00:00 e 23:59.');
      return;
    }
    if (!timeRegex.test(formEnd)) {
      showError('Horário de término inválido. O horário deve estar entre 00:00 e 23:59.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(formColor)) {
      showError('A cor informada é inválida. Use o formato Hexadecimal (Ex: #FF0000).');
      return;
    }

    // Validação Lógica de Tempo
    const startMinutes = parseInt(formTime.split(':')[0]) * 60 + parseInt(formTime.split(':')[1]);
    const endMinutes = parseInt(formEnd.split(':')[0]) * 60 + parseInt(formEnd.split(':')[1]);

    if (startMinutes >= endMinutes) {
      showError('Inconsistência de horário! O término deve ser mais tarde que o início.');
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
        status: 'confirmado',
        color: formColor,
      };

      if (editingId) {
        await api.put(`/api/appointments/${editingId}`, payload);
      } else {
        await api.post('/api/appointments', payload);
      }

      await fetchAppointments();
      setIsModalVisible(false);
    } catch (err: any) {
      console.error("Erro ao salvar agendamento:", err);
      showError(err.response?.data?.error || "Falha ao salvar agendamento no servidor.");
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
        await api.delete(`/api/appointments/${deleteConfirmId}`);
        setDeleteConfirmId(null);
        if (isModalVisible) setIsModalVisible(false);
        await fetchAppointments();
      } catch (err: any) {
        console.error("Erro ao excluir agendamento:", err);
        showError(err.response?.data?.error || "Falha ao excluir agendamento.");
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
        {isSearching && viewMode !== 'Mês' ? (
          <View style={styles.searchContainer}>
            <TextInput 
               style={styles.searchInput}
               placeholder="Buscar paciente..."
               placeholderTextColor="rgba(255,255,255,0.5)"
               value={searchQuery}
               onChangeText={setSearchQuery}
               autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={{ padding: 4 }}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Agenda</Text>
            {viewMode !== 'Mês' && (
              <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearching(true)}>
                <Search size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* TOGGLE */}
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
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DYNAMIC VIEWS */}
      {isLoadingHolidays ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC857" />
          <Text style={styles.loadingText}>Carregando calendário...</Text>
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
              onDateChange={setSelectedDate}
            />
          )}
          
          {viewMode === 'Semana' && (
            <WeeklyView 
              currentDate={selectedDate} 
              appointments={filteredAppointments} 
              holidays={holidays}
              onDayPress={handleDayPress}
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
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreateModal}>
        <Plus size={32} color="#181c1c" />
      </TouchableOpacity>

      {/* MODAL CRUD */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* SPINNER & PROCESSING OVERLAY - FULL SCREEN CENTERED */}
          {isSaving && (
            <View style={styles.fullScreenProcessingOverlay}>
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color="#FFC857" style={{ marginBottom: 14 }} />
                <Text style={styles.processingTitle}>
                  {editingId ? 'Processando e validando edição...' : 'Criando agendamento...'}
                </Text>
                <Text style={styles.processingSub}>Aguarde a confirmação das alterações</Text>
              </View>
            </View>
          )}

          <View style={[styles.modalContent, { maxHeight: Dimensions.get('window').height * 0.85 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</Text>
              <TouchableOpacity 
                onPress={() => !isSaving && setIsModalVisible(false)} 
                style={[styles.closeBtn, isSaving && { opacity: 0.5 }]}
                disabled={isSaving}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled" 
              contentContainerStyle={styles.formContainer}
            >
              <Text style={styles.label}>Nome do Agendamento</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: Sessão de Terapia" 
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={formTitle} 
                onChangeText={setFormTitle} 
                editable={!isSaving}
              />

              <Text style={styles.label}>Nome do Paciente</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: João Silva" 
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={formName} 
                onChangeText={setFormName} 
                editable={!isSaving}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
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
                  <Text style={styles.label}>Tipo</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ex: Avaliação" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formType} 
                    onChangeText={setFormType} 
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Início (hh:mm)</Text>
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
                  <Text style={styles.label}>Fim (hh:mm)</Text>
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

              <Text style={styles.label}>Cor de Destaque (Hexadecimal)</Text>
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

              <Text style={styles.label}>Cores Recentes</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.recentColorsRow}
              >
                {recentColors.map(color => (
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
                ))}
              </ScrollView>

            </ScrollView>

            <View style={styles.modalFooter}>
              {editingId && (
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
                  <Text style={styles.saveBtnText}>{editingId ? 'Salvar Alterações' : 'Salvar'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* ERROR TOAST */}
        {showErrorToast && (
          <Animated.View style={[styles.errorToastContainer, { transform: [{ translateX: errorSlideAnim }] }]}>
            <View style={styles.errorToastIconBg}>
              <XCircle color="#FF4B4B" size={28} />
            </View>
            <View style={styles.toastTextContainer}>
              <Text style={styles.errorToastTitle}>Ops, algo deu errado!</Text>
              <Text style={styles.toastMessage}>{errorMessage}</Text>
            </View>
          </Animated.View>
        )}
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

            <Text style={styles.pickerTitle}>Escolha uma Cor</Text>
            
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
              <Text style={styles.pickerSaveText}>Confirmar Cor</Text>
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
            <Text style={styles.deleteModalTitleRed}>Excluir Agendamento</Text>
            <Text style={styles.deleteModalMessage}>
              Tem certeza que deseja remover este agendamento? Esta ação não poderá ser desfeita.
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable 
                style={({ pressed }) => [styles.deleteModalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setDeleteConfirmId(null)}
              >
                {({ pressed }) => (
                  <Text style={[styles.deleteModalCancelText, pressed && { color: '#FFF' }]}>Cancelar</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.deleteModalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmDeletion}
              >
                {({ pressed }) => (
                  <Text style={[styles.deleteModalConfirmTextRed, pressed && { color: '#FFF' }]}>Excluir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#084D48' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, minHeight: 110 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  iconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12, paddingRight: 8 },
  toggleContainer: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleText: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },
  toggleTextActive: { color: '#084D48' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC857', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#084D48', borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '60%', padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  closeBtn: { padding: 4 },
  formContainer: { paddingBottom: 20 },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  saveBtn: { backgroundColor: '#FFC857', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, flex: 1, alignItems: 'center', marginLeft: 16 },
  saveBtnText: { color: '#084D48', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { padding: 14, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 16, fontWeight: '600' },

  // Toast Styles
  errorToastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20, right: 16, left: 16, backgroundColor: '#181c1c', borderLeftWidth: 6, borderLeftColor: '#FF4B4B', borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20, zIndex: 9999 },
  errorToastIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 75, 75, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 75, 75, 0.4)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  toastTextContainer: { flex: 1 },
  errorToastTitle: { color: '#FF4B4B', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  toastMessage: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '500' },

  // Color Picker
  colorPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, marginBottom: 16 },
  colorPreview: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 12 },
  hexInput: { flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold' },
  recentColorsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colorBubble: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  colorBubbleSelected: { borderColor: '#fff' },

  // Color Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  pickerContent: { backgroundColor: '#084D48', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  pickerCloseBtn: { position: 'absolute', top: 20, left: 20, padding: 4, zIndex: 10 },
  pickerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 24, marginTop: 4 },
  pickerSaveBtn: { backgroundColor: '#FFC857', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  pickerSaveText: { color: '#084D48', fontSize: 16, fontWeight: 'bold' },

  // Delete Confirmation Modal
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  deleteModalContainer: { width: '100%', backgroundColor: '#181c1c', borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center' },
  deleteModalContainerRed: { borderColor: 'rgba(255, 75, 75, 0.2)' },
  deleteModalIconBgRed: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 75, 75, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 75, 75, 0.3)' },
  deleteModalTitleRed: { color: '#FF4B4B', fontSize: 22, fontWeight: '900', marginBottom: 12 },
  deleteModalMessage: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  deleteModalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  deleteModalCancelButton: { flex: 1, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  deleteModalCancelText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 'bold' },
  deleteModalConfirmButtonRed: { flex: 1, height: 52, borderRadius: 12, backgroundColor: '#FF4B4B', alignItems: 'center', justifyContent: 'center' },
  deleteModalConfirmTextRed: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Processing Overlay Styles
  fullScreenProcessingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 25,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 77, 72, 0.9)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  processingCard: {
    backgroundColor: '#181c1c',
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.4)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  processingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  processingSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
});

