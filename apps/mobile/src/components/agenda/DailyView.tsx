import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Sparkles, MoreHorizontal, Edit3, Trash2, X, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Appointment {
  id: string | number;
  date: string;
  time: string;
  end: string;
  title: string;
  name: string;
  type: string;
  status: string;
  color: string;
  notes?: string;
  patientId?: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

interface DailyViewProps {
  selectedDate: string;
  appointments: Appointment[];
  holidays?: Holiday[];
  onEdit: (app: Appointment) => void;
  onDelete: (id: any) => void;
  onStatusChange?: (id: string | number, status: string) => void;
  onDateChange?: (date: string) => void;
}

const parseISODate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
  return new Date(year, month, day);
};

export function DailyView({ selectedDate, appointments, holidays = [], onEdit, onDelete, onStatusChange }: DailyViewProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const [optionsApp, setOptionsApp] = useState<Appointment | null>(null);

  const todaysAppointments = appointments.filter(app => app.date === selectedDate);
  todaysAppointments.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const dateObj = parseISODate(selectedDate);
  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  const formattedDate = dateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const currentHoliday = holidays.find(h => h.date === selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return '#10B981';
      case 'concluido': return '#0284C7';
      case 'cancelado': return '#EF4444';
      case 'falta': return '#6B7280';
      default: return '#F59E0B'; // a_confirmar
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado': return t.agenda.statusConfirmado;
      case 'concluido': return t.agenda.statusConcluido;
      case 'cancelado': return t.agenda.statusCancelado;
      case 'falta': return t.agenda.statusFalta;
      default: return t.agenda.statusAConfirmar;
    }
  };

  const statusList = [
    { id: 'a_confirmar', label: t.agenda.statusAConfirmar, color: '#F59E0B', bgActive: '#FEF3C7' },
    { id: 'confirmado', label: t.agenda.statusConfirmado, color: '#10B981', bgActive: '#D1FAE5' },
    { id: 'concluido', label: t.agenda.statusConcluido, color: '#0284C7', bgActive: '#E0F2FE' },
    { id: 'cancelado', label: t.agenda.statusCancelado, color: '#EF4444', bgActive: '#FEE2E2' },
    { id: 'falta', label: t.agenda.statusFalta, color: '#6B7280', bgActive: '#F3F4F6' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{formattedDate}</Text>
      
      {currentHoliday && (
        <View style={styles.holidayBanner}>
          <View style={styles.holidayIconBg}>
            <Sparkles size={20} color="#7B61FF" />
          </View>
          <View style={{ flex: 1 }}>
             <Text style={styles.holidayBannerTitle}>{currentHoliday.type === 'nacional' ? t.agenda.nationalHoliday : t.agenda.commemorativeDate}</Text>
             <Text style={styles.holidayBannerText}>{currentHoliday.name}</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.appointmentList} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {todaysAppointments.map((app) => {
          const statusColor = getStatusColor(app.status);

          return (
            <View key={app.id}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.appointmentCard}
                onPress={() => onEdit(app)}
              >
                <View style={[styles.cardBorder, { backgroundColor: app.color || theme.colors.primary }]} />

                <View style={styles.timeCol}>
                  <Text style={styles.timeStart}>{app.time}</Text>
                  <Text style={styles.timeEnd}>{app.end}</Text>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.appName}>{app.title}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.appType}>{`${app.type} • ${app.name}`}</Text>
                  </View>

                  {/* Notes Preview if available */}
                  {!!app.notes && (
                    <View style={styles.notesRow}>
                      <FileText size={12} color={theme.colors.textMuted} />
                      <Text style={styles.notesText} numberOfLines={1}>{app.notes}</Text>
                    </View>
                  )}

                  <View style={[styles.statusBadgePill, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {getStatusLabel(app.status)}
                    </Text>
                  </View>
                </View>

                {/* Translucent 3 dots button */}
                <TouchableOpacity 
                  style={styles.threeDotsBtn}
                  activeOpacity={0.6}
                  onPress={(e) => {
                    e.stopPropagation();
                    setOptionsApp(app);
                  }}
                >
                  <MoreHorizontal size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          );
        })}

        {todaysAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.agenda.noAppointmentsDay}</Text>
          </View>
        )}
      </ScrollView>

      {/* OPTIONS MODAL */}
      <Modal visible={!!optionsApp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setOptionsApp(null)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <View style={[styles.optionsModalContent, { borderColor: optionsApp ? `${optionsApp.color}50` : theme.colors.cardBorder, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.agenda.appointmentOptions}</Text>
              <TouchableOpacity onPress={() => setOptionsApp(null)} style={styles.closeBtn}>
                <X size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {optionsApp && (
              <View style={styles.appSummaryBox}>
                <Text style={styles.appSummaryTitle}>{optionsApp.title}</Text>
                <Text style={styles.appSummarySubtitle}>{`${optionsApp.name} • ${optionsApp.time} - ${optionsApp.end}`}</Text>
              </View>
            )}

            {/* Quick Status Selection */}
            {onStatusChange && optionsApp && (
              <View style={styles.statusSectionContainer}>
                <Text style={styles.statusSectionTitle}>{t.agenda.statusLabel}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPillsRow}>
                  {statusList.map((item) => {
                    const isActive = optionsApp.status === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.statusOptionPill,
                          { borderColor: isActive ? item.color : theme.colors.cardBorder },
                          isActive && { backgroundColor: item.bgActive }
                        ]}
                        onPress={() => {
                          const targetId = optionsApp.id;
                          setOptionsApp(prev => prev ? { ...prev, status: item.id } : null);
                          onStatusChange(targetId, item.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.statusOptionDot, { backgroundColor: item.color }]} />
                        <Text style={[styles.statusOptionText, { color: isActive ? item.color : theme.colors.textDark, fontWeight: isActive ? '800' : '600' }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={styles.optionCard}
              activeOpacity={0.7}
              onPress={() => {
                const target = optionsApp;
                setOptionsApp(null);
                if (target) onEdit(target);
              }}
            >
              <View style={[styles.optionIconBox, { backgroundColor: theme.colors.tealSoft, borderColor: theme.colors.tealMint }]}>
                <Edit3 size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={styles.optionTitle}>{t.agenda.editAppointment}</Text>
                <Text style={styles.optionDesc}>{t.agenda.editAppointmentDesc}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionCard, styles.optionCardDanger]}
              activeOpacity={0.7}
              onPress={() => {
                const target = optionsApp;
                setOptionsApp(null);
                if (target) onDelete(target.id);
              }}
            >
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(224, 122, 95, 0.15)', borderColor: 'rgba(224, 122, 95, 0.3)' }]}>
                <Trash2 size={20} color={theme.colors.accentOrange} />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={[styles.optionTitle, { color: theme.colors.accentOrange }]}>{t.agenda.deleteAppointment}</Text>
                <Text style={styles.optionDesc}>{t.agenda.deleteAppointmentDesc}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { color: theme.colors.textDark, fontSize: 16, fontWeight: '800', paddingHorizontal: 20, marginBottom: 14, textTransform: 'capitalize' },
  holidayBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.purpleSoft, marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.badgePurple },
  holidayIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.badgePurple, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  holidayBannerTitle: { color: theme.colors.badgePurpleText, fontSize: 11, textTransform: 'uppercase', fontWeight: '800', marginBottom: 2 },
  holidayBannerText: { color: theme.colors.badgePurpleText, fontWeight: '700', fontSize: 15 },
  appointmentList: { paddingHorizontal: 20 },
  appointmentCard: { flexDirection: 'row', backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.lg, marginBottom: 12, padding: 16, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.subtle },
  cardBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  threeDotsBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  timeCol: { marginRight: 14, alignItems: 'center', paddingLeft: 6 },
  timeStart: { color: theme.colors.textDark, fontSize: 17, fontWeight: '800' },
  timeEnd: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' },
  infoCol: { flex: 1 },
  appName: { color: theme.colors.textDark, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  appType: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  notesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  notesText: { color: theme.colors.textMuted, fontSize: 11, fontStyle: 'italic', flex: 1 },
  statusBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: theme.colors.textMuted, fontSize: 15 },

  /* Options Modal Styles */
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 20 },
  modalBackground: { ...StyleSheet.absoluteFillObject },
  optionsModalContent: {
    width: '100%',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.floating,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textDark },
  closeBtn: { padding: 6, backgroundColor: theme.colors.tealSoft, borderRadius: 20 },
  appSummaryBox: { backgroundColor: theme.colors.tealSoft, padding: 12, borderRadius: theme.radii.md, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.tealMint },
  appSummaryTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.primary },
  appSummarySubtitle: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  statusSectionContainer: { marginBottom: 16 },
  statusSectionTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.textDark, marginBottom: 8 },
  statusPillsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  statusOptionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radii.full, borderWidth: 1, backgroundColor: '#FFFFFF' },
  statusOptionDot: { width: 6, height: 6, borderRadius: 3 },
  statusOptionText: { fontSize: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    padding: 14,
    marginBottom: 10,
  },
  optionCardDanger: {
    borderColor: 'rgba(224, 122, 95, 0.3)',
    backgroundColor: 'rgba(224, 122, 95, 0.05)',
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextColumn: { flex: 1 },
  optionTitle: { color: theme.colors.textDark, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  optionDesc: { color: theme.colors.textMuted, fontSize: 12 },
});
