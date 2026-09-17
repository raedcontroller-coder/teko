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
  Easing,
  Dimensions
} from 'react-native';

const screenWidth = Dimensions.get('window').width;
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
import { theme } from '../../../theme/theme';
import { useTranslation } from '../../../i18n';

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
  { key: 'Sessão', labelKey: 'catSessao', color: theme.colors.primary, icon: Activity },
  { key: 'Família', labelKey: 'catFamilia', color: '#D97706', icon: Users },
  { key: 'Escola', labelKey: 'catEscola', color: theme.colors.badgePurpleText, icon: Book },
  { key: 'Outros', labelKey: 'catOutros', color: '#059669', icon: FileText }
];

export function NotasTab({ patientId, adminPsicologoId }: NotasTabProps) {
  const { t } = useTranslation();
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

  // Toast States
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);
  };

  const triggerErrorToast = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);

    setTimeout(() => {
      setShowErrorToast(false);
    }, 3500);
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
          color: item.color || theme.colors.primary,
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
    const cat = CATEGORIES.find(c => c.key === note.category) || CATEGORIES[0];
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
      triggerErrorToast(t.common.error);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        category: activeCategory.key,
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
        triggerSuccessToast(t.notas.saveSuccess);
      } else {
        // Criar Nova Nota
        const url = adminPsicologoId 
          ? `/api/patients/${patientId}/notes?psicologoId=${adminPsicologoId}`
          : `/api/patients/${patientId}/notes`;
        await api.post(url, payload);
        await fetchNotes();
        closeModal();
        triggerSuccessToast(t.notas.saveSuccess);
      }
    } catch (err: any) {
      console.error("Erro ao salvar nota clínica:", err);
      triggerErrorToast(err.response?.data?.error || t.common.error);
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
      triggerSuccessToast(t.notas.deleteSuccess);
    } catch (err: any) {
      console.error("Erro ao excluir nota clínica:", err);
      triggerErrorToast(err.response?.data?.error || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        {notes.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>{t.notas.noNotes}</Text>
          </View>
        )}
        
        {notes.map((note, index) => {
          const categoryObj = CATEGORIES.find(c => c.key === note.category) || CATEGORIES[3];
          const categoryLabel = t.notas[categoryObj.labelKey as keyof typeof t.notas] || note.category;
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
                style={[styles.noteCard, { borderColor: theme.colors.cardBorder }]}
                activeOpacity={0.7}
                onPress={() => openModalForEdit(note)}
              >
                
                {/* SVG Watermark background */}
                <View style={[styles.cardBgIcon, { opacity: 0.12 }]}>
                  <NoteIcon size={120} color={note.color} />
                </View>

                <View style={styles.noteHeader}>
                  <View style={[styles.categoryPill, { backgroundColor: `${note.color}15`, borderColor: `${note.color}40`, alignSelf: 'flex-start', marginBottom: 8 }]}>
                    <Text style={[styles.categoryText, { color: note.color }]}>{categoryLabel}</Text>
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
                    <MoreHorizontal size={24} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openModalForNew} activeOpacity={0.8}>
        <Plus size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* OPTIONS MODAL (Custom Popup Teko Style) */}
      <Modal visible={!!optionsNote} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setOptionsNote(null)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <View style={styles.optionsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.notas.optionsTitle}</Text>
              <TouchableOpacity onPress={() => setOptionsNote(null)} style={styles.closeBtn}>
                <X size={24} color={theme.colors.textDark} />
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
              <View style={[styles.optionIconBox, { backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}30` }]}>
                <Edit3 size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={styles.optionTitle}>{t.notas.editNoteBtn}</Text>
                <Text style={styles.optionDesc}>{t.common.edit}</Text>
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
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)' }]}>
                <Trash2 size={24} color="#DC2626" />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={[styles.optionTitle, { color: '#DC2626' }]}>{t.notas.deleteNoteBtn}</Text>
                <Text style={styles.optionDesc}>{t.common.delete}</Text>
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

          <View style={[styles.optionsModalContent, { borderColor: 'rgba(220, 38, 38, 0.4)', alignItems: 'center' }]}>
            <View style={[styles.optionIconBox, { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', marginBottom: 16, marginRight: 0 }]}>
              <AlertTriangle size={32} color="#DC2626" />
            </View>
            <Text style={[styles.modalTitle, { marginBottom: 8, textAlign: 'center' }]}>{t.notas.deleteConfirmTitle}</Text>
            <Text style={[styles.optionDesc, { textAlign: 'center', marginBottom: 24 }]}>
              {t.notas.deleteConfirmText}
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity 
                style={styles.cancelActionBtn} 
                onPress={() => setDeleteConfirmId(null)}
                disabled={saving}
              >
                <Text style={styles.cancelActionText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dangerActionBtn} 
                onPress={executeDelete}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.dangerActionText}>{t.common.delete}</Text>
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
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? t.notas.editNoteBtn : t.notas.newNoteBtn}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <X size={24} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t.notas.categoryLabel}</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(cat => {
                const catText = t.notas[cat.labelKey as keyof typeof t.notas] || cat.key;
                const isSelected = activeCategory.key === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.catPill, 
                      isSelected 
                        ? { backgroundColor: cat.color, borderColor: cat.color } 
                        : { borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.bg }
                    ]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[
                      styles.catPillText, 
                      isSelected ? { color: '#FFFFFF', fontWeight: 'bold' } : { color: theme.colors.textDark }
                    ]}>{catText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>{t.notas.contentLabel}</Text>
            <TextInput
              style={[
                styles.textArea, 
                emptyNoteError 
                  ? { borderColor: '#DC2626', borderWidth: 2 } 
                  : { borderColor: theme.colors.cardBorder }
              ]}
              multiline
              autoFocus
              placeholder={t.notas.contentPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={noteContent}
              onChangeText={(t) => {
                setNoteContent(t);
                if (emptyNoteError) setEmptyNoteError(false);
              }}
            />
            {emptyNoteError && (
              <Text style={styles.errorText}>{t.notas.emptyError}</Text>
            )}

            <View style={styles.modalActions}>
              {editingId && (
                <TouchableOpacity style={styles.editorDeleteBtn} onPress={() => setDeleteConfirmId(editingId)} disabled={saving}>
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>{t.notas.saveNoteBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Popup Toast de Sucesso Teko Style */}
      {showSuccessToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{t.common.success}</Text>
            <Text style={styles.toastMessage}>{successMessage}</Text>
          </View>
        </View>
      )}

      {/* Popup Toast de Erro Teko Style */}
      {showErrorToast && (
        <View style={styles.errorToastContainer}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#DC2626" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>{t.common.error}</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: theme.colors.textMuted, marginTop: 12, fontSize: 14 },
  
  fab: { 
    position: 'absolute', 
    bottom: 130, 
    right: 24, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: theme.colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: theme.colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 8,
    zIndex: 10
  },
  
  timeline: { paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: theme.colors.textMuted, marginTop: 12, fontSize: 16 },
  
  noteRow: { flexDirection: 'row', marginBottom: 16 },
  timelineVisual: { width: 30, alignItems: 'center', marginRight: 8 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 24, zIndex: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  timelineLine: { position: 'absolute', top: 36, bottom: -40, width: 2, backgroundColor: theme.colors.cardBorder, zIndex: 1 },
  
  noteCard: { flex: 1, backgroundColor: theme.colors.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardBgIcon: { position: 'absolute', top: -20, right: -20, pointerEvents: 'none' },
  noteHeader: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12, zIndex: 1 },
  noteDate: { color: theme.colors.textDark, fontSize: 15, fontWeight: '700' },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 12, fontWeight: 'bold' },
  noteTitle: { color: theme.colors.textDark, fontSize: 15, lineHeight: 22, zIndex: 1 },
  
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    zIndex: 1
  },
  optionsBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.bg,
  },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 16 },
  modalBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  
  // Custom Options Modal specific styles
  optionsModalContent: {
    backgroundColor: theme.colors.cardBg, 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
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
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDesc: {
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center'
  },
  cancelActionText: {
    color: theme.colors.textDark,
    fontWeight: 'bold',
    fontSize: 16
  },
  dangerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dangerActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Editor Modal Specific Styles
  modalContent: { 
    backgroundColor: theme.colors.cardBg, 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textDark },
  closeBtn: { padding: 6, backgroundColor: theme.colors.bg, borderRadius: 20 },
  
  inputLabel: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 14, fontWeight: '600' },
  
  textArea: { 
    backgroundColor: theme.colors.bg,
    borderRadius: 16, 
    padding: 16, 
    color: theme.colors.textDark, 
    fontSize: 16, 
    minHeight: 160, 
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 8,
  },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 16, paddingHorizontal: 4 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  editorDeleteBtn: { padding: 16, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)', marginRight: 16 },
  saveBtn: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  /* Teko Toast Banners */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -105 : -110,
    right: 0,
    left: 0,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 99999,
  },
  toastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: theme.colors.primary, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    color: theme.colors.textDark,
    fontSize: 13,
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -105 : -110,
    right: 0,
    left: 0,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: '#DC2626',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 99999,
  },
  errorToastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  errorToastTitle: {
    color: '#DC2626', 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
});
