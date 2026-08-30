import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface Appointment {
  id: number;
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
  onDelete: (id: number) => void;
}

export function DailyView({ selectedDate, appointments, holidays = [], onEdit, onDelete }: DailyViewProps) {
  const todaysAppointments = appointments.filter(app => app.date === selectedDate);
  
  // Format date correctly in local time
  const [year, month, day] = selectedDate.split('-');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

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
             <Text style={styles.holidayBannerTitle}>{currentHoliday.type === 'nacional' ? 'Feriado Nacional' : 'Data Comemorativa'}</Text>
             <Text style={styles.holidayBannerText}>{currentHoliday.name}</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.appointmentList} contentContainerStyle={{ paddingBottom: 120 }}>
        {todaysAppointments.map((app, index) => (
          <View key={app.id}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.appointmentCard}
              onPress={() => onEdit(app)}
              onLongPress={() => onDelete(app.id)}
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
            </TouchableOpacity>
          </View>
        ))}
        {todaysAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sem agendamentos para este dia.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateSelector: { maxHeight: 90, marginBottom: 16 },
  sectionTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 24, marginBottom: 16, textTransform: 'capitalize' },
  holidayBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(123, 97, 255, 0.1)', marginHorizontal: 24, marginBottom: 20, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(123, 97, 255, 0.3)' },
  holidayIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(123, 97, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  holidayBannerTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  holidayBannerText: { color: '#B4A2FF', fontWeight: 'bold', fontSize: 16 },
  dayCard: { width: 64, height: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dayCardActive: { backgroundColor: '#FFC857' },
  dayLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  dayLabelActive: { color: '#181c1c' },
  dayNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  dayNumberActive: { color: '#181c1c' },
  appointmentList: { paddingHorizontal: 24 },
  appointmentCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginBottom: 16, padding: 16, alignItems: 'center', overflow: 'hidden' },
  cardBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  timeCol: { marginRight: 16, alignItems: 'center', paddingLeft: 8 },
  timeStart: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timeEnd: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  infoCol: { flex: 1 },
  appName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  appType: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
