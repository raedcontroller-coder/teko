import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ActivityIndicator, 
  Animated, 
  Easing 
} from 'react-native';
import { 
  Plus, 
  X, 
  Trash2, 
  Save, 
  FileText, 
  Users, 
  Book, 
  Activity, 
  MoreHorizontal, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react-native';
import { api } from '../../../services/api';

interface Note {
  id: string;
  date: string;
  category: string;
  title: string;
  color: string;
  createdAt?: string;
}

interface NotasTabProps {
  patientId?: string;
  adminPsicologoId?: string;
}

const CATEGORIES = [
  { label: 'Sessão', color: '#3B82F6', icon: Activity },
  { label: 'Família', color: '#F59E0B', icon: Users },
  { label: 'Escola', color: '#8B5CF6', icon: Book },
  { label: 'Outros', color: '#10B981', icon: FileText }
];

export function NotasTab({ patientId, adminPsicologoId }: NotasTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [optionsNote, setOptionsNote] = useState<Note | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [emptyNoteError, setEmptyNoteError] = useState(false);
  
  // Form State
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [noteContent, setNoteContent] = useState('');

  // Toast States & Animations
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    Animated.timing(slideAnim, {
      toValue: 20,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => setShowSuccessToast(false));
    }, 3000);
  };

  const triggerErrorToast = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    Animated.timing(errorSlideAnim, {
      toValue: 20,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    setTimeout(() => {
      Animated.timing(errorSlideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => setShowErrorToast(false));
    }, 3000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const day = d.getDate();
      const month = d.toLocaleString('pt-BR', { month: 'long' });
      return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)}`;
    } catch {
      return dateString;
    }
  };

  const fetchNotes = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const url = adminPsicologoId 
        ? `/api/patients/${patientId}/notes?psicologoId=${adminPsicologoId}`
        : `/api/patients/${patientId}/notes`;
      const response = await api.get(url);
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const formatted = response.data.data.map((item: any) => ({
          id: item.id,
          date: formatDate(item.createdAt),
          category: item.category || 'Sessão',
          title: item.title,
          color: item.color || '#3B82F6',
          createdAt: item.createdAt,
        }));
        setNotes(formatted);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("Erro ao carregar notas clínicas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [patientId, adminPsicologoId]);

  const openModalForNew = () => {
    setEditingId(null);
    setActiveCategory(CATEGORIES[0]);
    setNoteContent('');
    setEmptyNoteError(false);
    setIsModalVisible(true);
  };

  const openModalForEdit = (note: Note) => {
    setEditingId(note.id);
    const cat = CATEGORIES.find(c => c.label === note.category) || CATEGORIES[0];
    setActiveCategory(cat);
    setNoteContent(note.title);
    setEmptyNoteError(false);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    if (!noteContent.trim()) {
      setEmptyNoteError(true);
      return;
    }

    if (!patientId) {
      triggerErrorToast("Identificador do paciente não informado.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        category: activeCategory.label,
        title: noteContent.trim(),
        color: activeCategory.color,
      };

      if (editingId) {
        // Editar Nota Existente
        const url = adminPsicologoId 
          ? `/api/patients/${patientId}/notes/${editingId}?psicologoId=${adminPsicologoId}`
          : `/api/patients/${patientId}/notes/${editingId}`;
        await api.put(url, payload);
        await fetchNotes();
        closeModal();
        triggerSuccessToast("Nota atualizada com sucesso!");
      } else {
        // Criar Nova Nota
        const url = adminPsicologoId 
          ? `/api/patients/${patientId}/notes?psicologoId=${adminPsicologoId}`
          : `/api/patients/${patientId}/notes`;
        await api.post(url, payload);
        await fetchNotes();
        closeModal();
        triggerSuccessToast("Nota criada com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro ao salvar nota clínica:", err);
      triggerErrorToast(err.response?.data?.error || "Falha ao salvar nota no servidor.");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmId || !patientId) return;
    try {
      setSaving(true);
      const targetId = deleteConfirmId;
      setDeleteConfirmId(null);

      const url = adminPsicologoId 
        ? `/api/patients/${patientId}/notes/${targetId}?psicologoId=${adminPsicologoId}`
        : `/api/patients/${patientId}/notes/${targetId}`;
      await api.delete(url);

      if (editingId === targetId) closeModal();
      await fetchNotes();
      triggerSuccessToast("Nota excluída com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir nota clínica:", err);
      triggerErrorToast(err.response?.data?.error || "Falha ao excluir nota.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC857" />
        <Text style={styles.loadingText}>Carregando bloco de notas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        {notes.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>Nenhuma nota registrada.</Text>
          </View>
        )}
        
        {notes.map((note, index) => {
          const categoryObj = CATEGORIES.find(c => c.label === note.category) || CATEGORIES[3];
          const NoteIcon = categoryObj.icon;

          return (
            <View key={note.id} style={styles.noteRow}>
              {/* Timeline Line & Dot */}
              <View style={styles.timelineVisual}>
                <View style={[styles.timelineDot, { backgroundColor: note.color, shadowColor: note.color }]} />
                {index < notes.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Note Card */}
              <TouchableOpacity 
                style={[styles.noteCard, { borderColor: `${note.color}40` }]}
                activeOpacity={0.7}
                onPress={() => openModalForEdit(note)}
              >
                
                {/* SVG Watermark background */}
                <View style={[styles.cardBgIcon, { opacity: 0.15 }]}>
                  <NoteIcon size={120} color={note.color} />
                </View>

                <View style={styles.noteHeader}>
                  <View style={[styles.categoryPill, { backgroundColor: `${note.color}20`, borderColor: `${note.color}50`, alignSelf: 'flex-start', marginBottom: 8 }]}>
                    <Text style={[styles.categoryText, { color: note.color }]}>{note.category}</Text>
                  </View>
                  <Text style={styles.noteDate}>{note.date}</Text>
                </View>

                <Text style={styles.noteTitle} numberOfLines={8}>{note.title}</Text>

                {/* Bottom Options Row */}
                <View style={styles.noteFooter}>
                  <TouchableOpacity 
                    style={styles.optionsBtn} 
                    onPress={() => setOptionsNote(note)}
                    activeOpacity={0.6}
                  >
                    <MoreHorizontal size={24} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>

              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openModalForNew} activeOpacity={0.8}>
        <Plus size={32} color="#181c1c" />
      </TouchableOpacity>

      {/* OPTIONS MODAL (Custom Popup Teko Style) */}
      <Modal visible={!!optionsNote} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setOptionsNote(null)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <View style={[styles.optionsModalContent, { borderColor: optionsNote ? `${optionsNote.color}40` : 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções da Nota</Text>
              <TouchableOpacity onPress={() => setOptionsNote(null)} style={styles.closeBtn}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.optionCard}
              activeOpacity={0.7}
              onPress={() => {
                const note = optionsNote;
                setOptionsNote(null);
                if (note) openModalForEdit(note);
              }}
            >
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(255, 200, 87, 0.1)', borderColor: 'rgba(255, 200, 87, 0.3)' }]}>
                <Edit3 size={24} color="#FFC857" />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={styles.optionTitle}>Editar Anotação</Text>
                <Text style={styles.optionDesc}>Modifique o texto, o título ou altere a categoria do registro.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionCard, { marginBottom: 0 }]}
              activeOpacity={0.7}
              onPress={() => {
                const note = optionsNote;
                setOptionsNote(null);
                if (note) setDeleteConfirmId(note.id);
              }}
            >
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.3)' }]}>
                <Trash2 size={24} color="#F87171" />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={[styles.optionTitle, { color: '#F87171' }]}>Excluir Anotação</Text>
                <Text style={styles.optionDesc}>Apague permanentemente esta nota da linha do tempo.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION DELETE MODAL */}
      <Modal visible={!!deleteConfirmId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setDeleteConfirmId(null)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <View style={[styles.optionsModalContent, { borderColor: 'rgba(248, 113, 113, 0.5)', alignItems: 'center' }]}>
            <View style={[styles.optionIconBox, { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.3)', marginBottom: 16, marginRight: 0 }]}>
              <AlertTriangle size={32} color="#F87171" />
            </View>
            <Text style={[styles.modalTitle, { marginBottom: 8, textAlign: 'center' }]}>Excluir Nota?</Text>
            <Text style={[styles.optionDesc, { textAlign: 'center', marginBottom: 24 }]}>
              Esta ação não pode ser desfeita. Tem certeza que deseja apagar permanentemente este registro?
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity 
                style={styles.cancelActionBtn} 
                onPress={() => setDeleteConfirmId(null)}
                disabled={saving}
              >
                <Text style={styles.cancelActionText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dangerActionBtn} 
                onPress={executeDelete}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Trash2 size={18} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.dangerActionText}>Excluir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDITOR MODAL (Glassmorphism Overlay) */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>
          
          <View style={[styles.modalContent, { borderColor: `${activeCategory.color}50` }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar Nota' : 'Nova Nota'}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Categoria</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.catPill, 
                    activeCategory.label === cat.label 
                      ? { backgroundColor: cat.color, borderColor: cat.color } 
                      : { borderColor: 'rgba(255,255,255,0.1)' }
                  ]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[
                    styles.catPillText, 
                    activeCategory.label === cat.label && { color: '#000', fontWeight: 'bold' }
                  ]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Conteúdo</Text>
            <TextInput
              style={[
                styles.textArea, 
                { backgroundColor: `${activeCategory.color}05` },
                emptyNoteError 
                  ? { borderColor: '#F87171', borderWidth: 2 } 
                  : { borderColor: `${activeCategory.color}50` }
              ]}
              multiline
              autoFocus
              placeholder="Digite suas observações..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={noteContent}
              onChangeText={(t) => {
                setNoteContent(t);
                if (emptyNoteError) setEmptyNoteError(false);
              }}
            />
            {emptyNoteError && (
              <Text style={styles.errorText}>A nota não pode estar vazia.</Text>
            )}

            <View style={styles.modalActions}>
              {editingId && (
                <TouchableOpacity style={styles.editorDeleteBtn} onPress={() => setDeleteConfirmId(editingId)} disabled={saving}>
                  <Trash2 size={20} color="#F87171" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: activeCategory.color }]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Save size={20} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Salvar Nota</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Popup Toast de Sucesso Teko Style */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color="#FFC857" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Sucesso!</Text>
            <Text style={styles.toastMessage}>{successMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Popup Toast de Erro Teko Style */}
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
  
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 24, 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#FFC857', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#FFC857', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 8, 
    elevation: 8,
    zIndex: 10
  },
  
  timeline: { paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 16 },
  
  noteRow: { flexDirection: 'row', marginBottom: 16 },
  timelineVisual: { width: 30, alignItems: 'center', marginRight: 8 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 24, zIndex: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  timelineLine: { position: 'absolute', top: 36, bottom: -40, width: 2, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 1 },
  
  noteCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardBgIcon: { position: 'absolute', top: -20, right: -20, pointerEvents: 'none' },
  noteHeader: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12, zIndex: 1 },
  noteDate: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 12, fontWeight: 'bold' },
  noteTitle: { color: '#fff', fontSize: 15, lineHeight: 22, zIndex: 1 },
  
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    zIndex: 1
  },
  optionsBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 16 },
  modalBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  
  // Custom Options Modal specific styles
  optionsModalContent: {
    backgroundColor: '#1c2222', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextColumn: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Delete Confirmation Specific Styles
  confirmActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12
  },
  cancelActionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center'
  },
  cancelActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  dangerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dangerActionText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Editor Modal Specific Styles
  modalContent: { 
    backgroundColor: '#1c2222', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  closeBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  
  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  catPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  
  textArea: { 
    borderRadius: 16, 
    padding: 16, 
    color: '#fff', 
    fontSize: 16, 
    minHeight: 160, 
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 8,
  },
  errorText: { color: '#F87171', fontSize: 13, marginBottom: 16, paddingHorizontal: 4 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  editorDeleteBtn: { padding: 16, backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.3)', marginRight: 16 },
  saveBtn: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  /* Teko Toast Banners */
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
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 9999,
  },
  toastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,200,87,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFC857', 
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
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
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 9999,
  },
  errorToastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  errorToastTitle: {
    color: '#FF4B4B', 
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
});
