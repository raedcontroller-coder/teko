import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

export interface Appointment {
  id: string | number;
  date: string;
  time?: string;
  end?: string;
  title?: string;
  name?: string;
  type?: string;
  status?: string;
  color: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

interface MonthlyViewProps {
  currentDate: string;
  appointments: Appointment[];
  holidays?: Holiday[];
  onDayPress: (date: string) => void;
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

export function MonthlyView({ currentDate, appointments, holidays = [], onDayPress }: MonthlyViewProps) {
  const { t, language } = useTranslation();
  const [viewDate, setViewDate] = useState<Date>(parseISODate(currentDate));

  useEffect(() => {
    if (currentDate) {
      setViewDate(parseISODate(currentDate));
    }
  }, [currentDate]);

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    setViewDate(newDate);
  };

  const generateMonthDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayApps = appointments.filter(app => app.date === isoDate);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      days.push({ number: i, isoDate, apps: dayApps, isWeekend });
    }
    return days;
  };

  const days = generateMonthDays();
  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  const monthName = viewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const weekdaysList = Array.isArray(t.agenda.shortWeekdays) ? t.agenda.shortWeekdays : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <View style={styles.container}>
      
      {/* HEADER DE NAVEGAÇÃO */}
      <View style={styles.navHeaderCard}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.75}>
          <ChevronLeft color={theme.colors.primary} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
        
        <View style={styles.monthTitleWrapper}>
          <Text style={styles.sectionTitle}>{monthName}</Text>
        </View>
        
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.75}>
          <ChevronRight color={theme.colors.primary} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <View style={styles.weekLabelsRow}>
          {weekdaysList.map((label: string, i: number) => {
            const isWeekendLabel = i === 0 || i === 6;
            return (
              <Text key={i} style={[styles.weekLabel, isWeekendLabel && styles.weekendLabel]}>{label}</Text>
            );
          })}
        </View>
        
        <View style={styles.grid}>
          {days.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={styles.cellContainer} />;
            
            const isToday = day.isoDate === currentDate;
            const isHoliday = holidays.some(h => h.date === day.isoDate);
            
            return (
              <View key={day.isoDate} style={styles.cellContainer}>
                <TouchableOpacity 
                  style={[
                    styles.cell, 
                    day.isWeekend && styles.cellWeekend,
                    isToday && styles.cellToday
                  ]}
                  onPress={() => onDayPress(day.isoDate)}
                  activeOpacity={0.7}
                >
                  {isHoliday && <View style={styles.holidayMarker} />}
                  <Text style={[
                    styles.cellNumber, 
                    day.isWeekend && styles.cellNumberWeekend,
                    isToday && styles.cellNumberToday
                  ]}>
                    {day.number}
                  </Text>
                  
                  {day.apps.length > 0 && (
                    <View style={styles.dotsRow}>
                      {day.apps.slice(0, 3).map((a, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: a.color || theme.colors.primary }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  navHeaderCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  monthTitleWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: `${theme.colors.primary}12`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}25`,
  },
  navBtn: { 
    width: 40, 
    height: 40, 
    backgroundColor: theme.colors.tealSoft, 
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`
  },
  sectionTitle: { 
    color: theme.colors.textDark, 
    fontSize: 17, 
    fontWeight: '800', 
    textTransform: 'capitalize',
    letterSpacing: -0.2
  },
  card: { 
    backgroundColor: theme.colors.cardBg,
    borderRadius: 24, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  weekLabelsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: `${theme.colors.cardBorder}80` },
  weekLabel: { color: theme.colors.textDark, fontSize: 11, fontWeight: '800', width: 36, textAlign: 'center', letterSpacing: 0.3 },
  weekendLabel: { color: theme.colors.textMuted }, 
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  cellContainer: { width: '14.28%', alignItems: 'center', justifyContent: 'center' },
  cell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  cellWeekend: { backgroundColor: theme.colors.tealSoft }, 
  cellToday: { backgroundColor: theme.colors.primary, borderWidth: 0, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  cellNumber: { color: theme.colors.textDark, fontSize: 16, fontWeight: '700' },
  cellNumberWeekend: { color: theme.colors.textMuted },
  cellNumberToday: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  holidayMarker: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.badgePurpleText },
  dotsRow: { flexDirection: 'row', position: 'absolute', bottom: 4, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 1.5 },
  moreDots: { color: theme.colors.textMuted, fontSize: 10, marginLeft: 2, fontWeight: '700' }
});
