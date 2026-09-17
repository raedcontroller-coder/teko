import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Sparkles, MoreHorizontal, Edit3, Trash2, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';

interface Appointment {
  id: string | number;
  date: string;
  time: string;
  end: string;
  title: string;
  name: string;
  type: string;
  status: string;
  color: string;
}

interface Holiday {
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
  onDateChange?: (date: string) => void;
}

import { useTranslation } from '../../i18n';

export function DailyView({ selectedDate, appointments, holidays = [], onEdit, onDelete }: DailyViewProps) {
  const { t, language } = useTranslation();
  const [optionsApp, setOptionsApp] = useState<Appointment | null>(null);
  const todaysAppointments = appointments.filter(app => app.date === selectedDate);
  
  // Format date correctly in local time according to selected app language
  const [year, month, day] = selectedDate.split('-');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  const formattedDate = dateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const currentHoliday = holidays.find(h => h.date === selectedDate);

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

      <ScrollView style={styles.appointmentList} contentContainerStyle={{ paddingBottom: 120 }}>
        {todaysAppointments.map((app) => (
          <View key={app.id}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.appointmentCard}
              onPress={() => onEdit(app)}
            >
              <View style={[styles.cardBorder, { backgroundColor: app.color }]} />

              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{app.time}</Text>
                <Text style={styles.timeEnd}>{app.end}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.appName}>{app.title}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: app.status === 'confirmado' ? '#10B981' : '#D1D5DB' }]} />
                  <Text style={styles.appType}>{app.type} • {app.name}</Text>
                </View>
              </View>

              {/* Botão translúcido de três pontos no canto direito */}
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
        ))}
        {todaysAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.agenda.noAppointmentsDay}</Text>
          </View>
        )}
      </ScrollView>

      {/* OPTIONS MODAL (Teko Translucent Options Style) */}
      <Modal visible={!!optionsApp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setOptionsApp(null)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <View style={[styles.optionsModalContent, { borderColor: optionsApp ? `${optionsApp.color}50` : theme.colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.agenda.appointmentOptions}</Text>
              <TouchableOpacity onPress={() => setOptionsApp(null)} style={styles.closeBtn}>
                <X size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textDark },
  closeBtn: { padding: 6, backgroundColor: theme.colors.tealSoft, borderRadius: 20 },
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
