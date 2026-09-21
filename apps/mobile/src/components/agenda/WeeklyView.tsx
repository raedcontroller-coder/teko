import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { ChevronLeft, ChevronRight, Edit3, Trash2, X, MoreHorizontal, FileText } from 'lucide-react-native';
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

interface WeeklyViewProps {
  currentDate: string;
  appointments: Appointment[];
  holidays?: Holiday[];
  onDayPress: (date: string) => void;
  onEdit?: (app: Appointment) => void;
  onDelete?: (id: any) => void;
  onStatusChange?: (id: string | number, status: string) => void;
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

const formatISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export function WeeklyView({ currentDate, appointments, holidays = [], onDayPress, onEdit, onDelete, onStatusChange }: WeeklyViewProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const [viewDate, setViewDate] = useState<Date>(parseISODate(currentDate));
  const [optionsApp, setOptionsApp] = useState<Appointment | null>(null);

  useEffect(() => {
    if (currentDate) {
      setViewDate(parseISODate(currentDate));
    }
  }, [currentDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() - 7);
    setViewDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + 7);
    setViewDate(newDate);
  };

  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return start;
  };

  const startOfWeek = getStartOfWeek(viewDate);
  const weekDays = [];
  const weekdaysList = Array.isArray(t.agenda.shortWeekdays) ? t.agenda.shortWeekdays : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isoDate = formatISODate(d);
    
    const label = weekdaysList[d.getDay()];
    const number = d.getDate();
    const dayApps = appointments.filter(app => app.date === isoDate);
    
    dayApps.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isHoliday = holidays.some(h => h.date === isoDate);
    
    weekDays.push({ isoDate, label, number, apps: dayApps, isWeekend, isHoliday });
  }

  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startDayNum = startOfWeek.getDate();
  const endDayNum = endOfWeek.getDate();
  const monthName = startOfWeek.toLocaleDateString(locale, { month: 'short' });
  const endMonthName = endOfWeek.toLocaleDateString(locale, { month: 'short' });
  const yearNum = endOfWeek.getFullYear();

  const headerTitleText = startOfWeek.getMonth() === endOfWeek.getMonth()
    ? `${startDayNum} - ${endDayNum} de ${startOfWeek.toLocaleDateString(locale, { month: 'long' })} ${yearNum}`
    : `${startDayNum} ${monthName} - ${endDayNum} ${endMonthName} ${yearNum}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return '#10B981';
      case 'concluido': return '#0284C7';
      case 'cancelado': return '#EF4444';
      case 'falta': return '#6B7280';
      default: return '#F59E0B';
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
      {/* Month Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevWeek} activeOpacity={0.75}>
          <ChevronLeft color={theme.colors.primary} size={20} />
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>{headerTitleText}</Text>
        
        <TouchableOpacity style={styles.navBtn} onPress={handleNextWeek} activeOpacity={0.75}>
          <ChevronRight color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Week List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {weekDays.map(day => {
          const isToday = day.isoDate === currentDate;
          
          return (
            <TouchableOpacity 
              key={day.isoDate}
              style={[styles.dayRow, day.isWeekend && styles.dayRowWeekend, isToday && styles.dayRowActive]}
              onPress={() => onDayPress(day.isoDate)}
              activeOpacity={0.7}
            >
              {/* Date Column */}
              <View style={styles.dateCol}>
                <Text style={[styles.dayLabel, day.isWeekend && styles.weekendText, isToday && styles.activeText]}>{day.label}</Text>
                <Text style={[styles.dayNumber, day.isWeekend && styles.weekendText, isToday && styles.activeText]}>{day.number}</Text>
                {day.isHoliday && <View style={styles.holidayMarker} />}
              </View>
              
              {/* Apps Column */}
              <View style={styles.appsCol}>
                {day.apps.length > 0 ? (
                  day.apps.map(app => {
                    const statusColor = getStatusColor(app.status);

                    return (
                      <TouchableOpacity 
                        key={app.id} 
                        style={styles.miniAppCard}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (onEdit) onEdit(app);
                          else setOptionsApp(app);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.colorLine, { backgroundColor: app.color || theme.colors.primary }]} />
                        <View style={styles.appTimeCol}>
                          <Text style={styles.miniAppTime}>{app.time}</Text>
                          {!!app.end && <Text style={styles.miniAppEndTime}>{app.end}</Text>}
                        </View>
                        
                        <View style={{ flex: 1, paddingRight: 4 }}>
                          <Text style={styles.miniAppName} numberOfLines={1}>{app.title}</Text>
                          <Text style={styles.miniAppSubtitle} numberOfLines={1}>{`${app.type} • ${app.name}`}</Text>
                          {!!app.notes && (
                            <View style={styles.notesRow}>
                              <FileText size={10} color={theme.colors.textMuted} />
                              <Text style={styles.notesText} numberOfLines={1}>{app.notes}</Text>
                            </View>
                          )}
                        </View>

                        <View style={[styles.statusBadgePill, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                            {getStatusLabel(app.status)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>{t.agenda.noAppointments}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* OPTIONS MODAL FOR APPOINTMENT IN WEEKLY VIEW */}
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

            {onEdit && (
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
            )}

            {onDelete && (
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
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { padding: 8, backgroundColor: theme.colors.tealSoft, borderRadius: theme.radii.md },
  sectionTitle: { color: theme.colors.textDark, fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  list: { flex: 1 },
  dayRow: { flexDirection: 'row', backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.lg, marginBottom: 10, padding: 12, minHeight: 84, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.subtle },
  dayRowWeekend: { backgroundColor: theme.colors.tealSoft, borderColor: theme.colors.tealMint },
  dayRowActive: { backgroundColor: theme.colors.cardBg, borderWidth: 2, borderColor: theme.colors.primary },
  dateCol: { width: 56, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: theme.colors.cardBorder, marginRight: 12, paddingRight: 10 },
  dayLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  dayNumber: { color: theme.colors.textDark, fontSize: 22, fontWeight: '800', marginTop: 2 },
  holidayMarker: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.badgePurpleText, marginTop: 4 },
  weekendText: { color: theme.colors.textMuted },
  activeText: { color: theme.colors.primary },
  appsCol: { flex: 1, justifyContent: 'center' },
  miniAppCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 10, borderRadius: theme.radii.sm, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.cardBorder },
  colorLine: { width: 4, height: '100%', borderRadius: 2, marginRight: 8 },
  appTimeCol: { marginRight: 8, width: 44 },
  miniAppTime: { color: theme.colors.textDark, fontSize: 12, fontWeight: '800' },
  miniAppEndTime: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '500' },
  miniAppName: { color: theme.colors.textDark, fontSize: 13, fontWeight: '700' },
  miniAppSubtitle: { color: theme.colors.textMuted, fontSize: 11, marginTop: 1 },
  notesRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  notesText: { color: theme.colors.textMuted, fontSize: 10, fontStyle: 'italic', flex: 1 },
  statusBadgePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radii.full, borderWidth: 1, marginLeft: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  emptyCard: { flex: 1, justifyContent: 'center' },
  emptyText: { color: theme.colors.textMuted, fontSize: 13, fontStyle: 'italic' },

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
