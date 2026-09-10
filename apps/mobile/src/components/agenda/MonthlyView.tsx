import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Appointment {
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

interface Holiday {
  date: string;
  name: string;
  type: string;
}

interface MonthlyViewProps {
  currentDate: string; // determines the initially selected day/month
  appointments: Appointment[];
  holidays?: Holiday[];
  onDayPress: (date: string) => void;
}

export function MonthlyView({ currentDate, appointments, holidays = [], onDayPress }: MonthlyViewProps) {
  const [viewDate, setViewDate] = useState(new Date((currentDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'));

  // Sincroniza caso o pai mude o currentDate drasticamente
  useEffect(() => {
    if (currentDate) {
      setViewDate(new Date(currentDate + 'T00:00:00'));
    }
  }, [currentDate]);

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
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
  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      
      {/* HEADER DE NAVEGAÇÃO */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronLeft color="#FFC857" size={24} />
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>{monthName}</Text>
        
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronRight color="#FFC857" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <View style={styles.weekLabelsRow}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, i) => {
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
                        <View key={i} style={[styles.dot, { backgroundColor: a.color }]} />
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
  container: { flex: 1, paddingHorizontal: 24 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  sectionTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
  card: { 
    backgroundColor: 'rgba(13, 118, 110, 0.4)', // glass-panel
    borderRadius: 24, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
  },
  weekLabelsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  weekLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'bold', width: 32, textAlign: 'center' },
  weekendLabel: { color: 'rgba(255, 200, 87, 0.6)' }, 
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  cellContainer: { width: '14.28%', alignItems: 'center', justifyContent: 'center' },
  cell: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cellWeekend: { backgroundColor: 'rgba(255, 200, 87, 0.15)' }, 
  cellToday: { backgroundColor: 'rgba(8, 77, 72, 0.5)', borderWidth: 2, borderColor: '#FFC857' },
  cellNumber: { color: '#fff', fontSize: 16 },
  cellNumberWeekend: { color: 'rgba(255, 200, 87, 0.8)' },
  cellNumberToday: { color: '#FFC857', fontWeight: 'bold', fontSize: 18 },
  holidayMarker: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#7B61FF', shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  dotsRow: { flexDirection: 'row', position: 'absolute', bottom: 4, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 2 },
  moreDots: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginLeft: 2, fontWeight: 'bold' }
});
