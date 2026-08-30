import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

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

interface WeeklyViewProps {
  currentDate: string;
  appointments: Appointment[];
  holidays?: Holiday[];
  onDayPress: (date: string) => void;
}

export function WeeklyView({ currentDate, appointments, holidays = [], onDayPress }: WeeklyViewProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate + 'T00:00:00'));

  useEffect(() => {
    setViewDate(new Date(currentDate + 'T00:00:00'));
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
    const diff = d.getDate() - day;
    const start = new Date(d);
    start.setDate(diff);
    return start;
  };

  const startOfWeek = getStartOfWeek(new Date(viewDate));
  const weekDays = [];
  
  const weekdaysBR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${dayNum}`;
    
    const label = weekdaysBR[d.getDay()];
    const number = d.getDate();
    const dayApps = appointments.filter(app => app.date === isoDate);
    
    dayApps.sort((a, b) => a.time.localeCompare(b.time));
    
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isHoliday = holidays.some(h => h.date === isoDate);
    
    weekDays.push({ isoDate, label, number, apps: dayApps, isWeekend, isHoliday });
  }

  const monthName = startOfWeek.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      
      {/* Month Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevWeek} activeOpacity={0.7}>
          <ChevronLeft color="#FFC857" size={24} />
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>{monthName}</Text>
        
        <TouchableOpacity style={styles.navBtn} onPress={handleNextWeek} activeOpacity={0.7}>
          <ChevronRight color="#FFC857" size={24} />
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
                  day.apps.map(app => (
                    <View key={app.id} style={styles.miniAppCard}>
                      <View style={[styles.colorLine, { backgroundColor: app.color }]} />
                      <Text style={styles.miniAppTime}>{app.time}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.miniAppName} numberOfLines={1}>{app.title}</Text>
                        <Text style={styles.miniAppSubtitle} numberOfLines={1}>{app.type} • {app.name}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Sem agendamentos</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  sectionTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' },
  list: { flex: 1 },
  dayRow: { flexDirection: 'row', backgroundColor: 'rgba(13, 118, 110, 0.4)', borderRadius: 16, marginBottom: 12, padding: 12, minHeight: 90, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dayRowWeekend: { backgroundColor: 'rgba(255, 200, 87, 0.15)', borderColor: 'transparent' },
  dayRowActive: { backgroundColor: 'rgba(8, 77, 72, 0.5)', borderWidth: 2, borderColor: '#FFC857' },
  dateCol: { width: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', marginRight: 12, paddingRight: 12 },
  dayLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' },
  dayNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  holidayMarker: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7B61FF', marginTop: 6, shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  weekendText: { color: 'rgba(255, 200, 87, 0.8)' },
  activeText: { color: '#FFC857' },
  appsCol: { flex: 1, justifyContent: 'center' },
  miniAppCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
  colorLine: { width: 4, height: '100%', borderRadius: 2, marginRight: 8 },
  miniAppTime: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', marginRight: 8, width: 40 },
  miniAppName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  miniAppSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  emptyCard: { flex: 1, justifyContent: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic' }
});
