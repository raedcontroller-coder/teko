import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing, Dimensions, ScrollView, Pressable } from 'react-native';
import { Plus, Search, X, Trash2, XCircle } from 'lucide-react-native';

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

  useEffect(() => {
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

  const [appointments, setAppointments] = useState([
    { id: 1, date: '2026-08-26', time: '09:00', end: '10:00', title: 'Sessão Inicial', name: 'Enzo Gabriel, 6 anos', type: 'Avaliação Cognitiva', status: 'confirmado', color: '#10B981' },
    { id: 2, date: '2026-08-26', time: '11:00', end: '11:45', title: 'Acompanhamento', name: 'Sofia Martins, 8 anos', type: 'Aguardando Confirmação', status: 'aguardando', color: '#F59E0B' },
    { id: 3, date: '2026-08-27', time: '14:00', end: '15:00', title: 'Sessão Lúdica Semanal', name: 'Lucas Silva, 7 anos', type: 'Terapia Infantil', status: 'confirmado', color: '#8B5CF6' },
    { id: 4, date: '2026-08-15', time: '10:00', end: '11:00', title: 'Entrevista de Devolutiva', name: 'Maria Eduarda', type: 'Retorno', status: 'confirmado', color: '#EF4444' }
  ]);

  // --- Search State ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = appointments.filter(app => {
    const q = searchQuery.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.title.toLowerCase().includes(q);
  });

  // --- Modal Form State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formType, setFormType] = useState('');
  const [formColor, setFormColor] = useState('#10B981');
  const [recentColors, setRecentColors] = useState<string[]>(['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6']);
  
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
  const handleTimeChange = (text: string, setTime: (val: string) => void) => {
    let val = text.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d)/, '$1:$2');
    }
    setTime(val.slice(0, 5));
  };

  const handleTimeBlur = (time: string, setTime: (val: string) => void) => {
    if (!time.trim()) return;
    let digits = time.replace(/\D/g, '');
    if (digits.length === 0) return;
    
    if (digits.length === 1) digits = `0${digits}00`;
    else if (digits.length === 2) digits = `${digits}00`;
    else if (digits.length === 3) digits = `${digits}0`;

    const h = parseInt(digits.slice(0, 2));
    const m = parseInt(digits.slice(2, 4));
    
    const validH = h > 23 ? 23 : h;
    const validM = m > 59 ? 59 : m;
    
    setTime(`${String(validH).padStart(2, '0')}:${String(validM).padStart(2, '0')}`);
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

  const handleSave = () => {
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

    // Atualiza cores recentes
    setRecentColors(prev => {
      const newColors = [formColor, ...prev.filter(c => c.toUpperCase() !== formColor.toUpperCase())];
      return newColors.slice(0, 5);
    });

    const finalIsoDate = formatToISO(formDate);

    if (editingId) {
      setAppointments(prev => prev.map(app => 
        app.id === editingId 
          ? { ...app, title: formTitle, name: formName, time: formTime, end: formEnd, type: formType, date: finalIsoDate, color: formColor } 
          : app
      ));
    } else {
      const newApp = {
        id: Date.now(),
        date: finalIsoDate,
        title: formTitle,
        name: formName,
        time: formTime,
        end: formEnd,
        type: formType,
        status: 'confirmado',
        color: formColor,
      };
      setAppointments(prev => {
        const newArr = [...prev, newApp];
        return newArr.sort((a, b) => a.time.localeCompare(b.time));
      });
    }
    setIsModalVisible(false);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDeletion = () => {
    if (deleteConfirmId !== null) {
      setAppointments(prev => prev.filter(app => app.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      if (isModalVisible) setIsModalVisible(false);
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
          <View style={[styles.modalContent, { maxHeight: Dimensions.get('window').height * 0.85 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
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
              />

              <Text style={styles.label}>Nome do Paciente</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: Enzo Gabriel" 
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={formName} 
                onChangeText={setFormName} 
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Data</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="26/08/2026" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formDate} 
                    onChangeText={handleDateChange} 
                    keyboardType="numeric"
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
                    onChangeText={(t) => handleTimeChange(t, setFormTime)} 
                    onBlur={() => handleTimeBlur(formTime, setFormTime)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Fim (hh:mm)</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="10:00" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formEnd} 
                    onChangeText={(t) => handleTimeChange(t, setFormEnd)} 
                    onBlur={() => handleTimeBlur(formEnd, setFormEnd)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Cor de Destaque (Hexadecimal)</Text>
              <View style={styles.colorPickerContainer}>
                <TouchableOpacity 
                  style={[styles.colorPreview, { backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(formColor) ? formColor : 'transparent' }]} 
                  onPress={() => setIsColorPickerVisible(true)}
                />
                <TextInput 
                  style={styles.hexInput}
                  value={formColor}
                  onChangeText={setFormColor}
                  maxLength={7}
                  autoCapitalize="characters"
                />
              </View>

              <Text style={styles.label}>Cores Recentes</Text>
              <View style={styles.recentColorsRow}>
                {recentColors.map(color => (
                  <TouchableOpacity 
                    key={color} 
                    style={[
                      styles.colorBubble, 
                      { backgroundColor: color }, 
                      formColor.toUpperCase() === color.toUpperCase() && styles.colorBubbleSelected
                    ]} 
                    onPress={() => setFormColor(color)}
                  />
                ))}
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              {editingId && (
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDelete(editingId)}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Salvar</Text>
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
              onPress={() => setIsColorPickerVisible(false)}
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
});

