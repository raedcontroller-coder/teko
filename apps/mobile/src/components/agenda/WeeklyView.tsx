import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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

interface WeeklyViewProps {
  currentDate: string;
  appointments: Appointment[];
  holidays?: Holiday[];
  onDayPress: (date: string) => void;
}

import { useTranslation } from '../../i18n';

export function WeeklyView({ currentDate, appointments, holidays = [], onDayPress }: WeeklyViewProps) {
  const { t, language } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date((currentDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'));

  useEffect(() => {
    if (currentDate) {
      setViewDate(new Date(currentDate + 'T00:00:00'));
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
    const diff = d.getDate() - day;
    const start = new Date(d);
    start.setDate(diff);
    return start;
  };

  const startOfWeek = getStartOfWeek(new Date(viewDate));
  const weekDays = [];
  
  const weekdaysList = t.agenda.shortWeekdays || ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${dayNum}`;
    
    const label = weekdaysList[d.getDay()];
    const number = d.getDate();
    const dayApps = appointments.filter(app => app.date === isoDate);
    
    dayApps.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isHoliday = holidays.some(h => h.date === isoDate);
    
    weekDays.push({ isoDate, label, number, apps: dayApps, isWeekend, isHoliday });
  }

  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  const formattedMonth = startOfWeek.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      
      {/* Month Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevWeek}>
          <ChevronLeft color={theme.colors.primary} size={20} />
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>{formattedMonth}</Text>
        
        <TouchableOpacity style={styles.navBtn} onPress={handleNextWeek}>
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
                    <Text style={styles.emptyText}>{t.agenda.noAppointments}</Text>
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
  container: { flex: 1, paddingHorizontal: 20 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { padding: 8, backgroundColor: theme.colors.tealSoft, borderRadius: theme.radii.md },
  sectionTitle: { color: theme.colors.textDark, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
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
  miniAppTime: { color: theme.colors.textDark, fontSize: 12, fontWeight: '700', marginRight: 8, width: 40 },
  miniAppName: { color: theme.colors.textDark, fontSize: 13, fontWeight: '700' },
  miniAppSubtitle: { color: theme.colors.textMuted, fontSize: 11, marginTop: 1 },
  emptyCard: { flex: 1, justifyContent: 'center' },
  emptyText: { color: theme.colors.textMuted, fontSize: 13, fontStyle: 'italic' }
});
