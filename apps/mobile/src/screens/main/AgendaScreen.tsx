import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Plus, Search } from 'lucide-react-native';

export function AgendaScreen() {
  const [viewMode, setViewMode] = useState<'Dia' | 'Semana' | 'Mês'>('Dia');
  const [selectedDay, setSelectedDay] = useState<number>(15);

  const days = [
    { label: 'SEG', number: 14 },
    { label: 'TER', number: 15 },
    { label: 'QUA', number: 16 },
    { label: 'QUI', number: 17 },
    { label: 'SEX', number: 18 },
  ];

  const appointments = [
    { id: 1, time: '09:00', end: '10:00', name: 'Enzo Gabriel, 6 anos', type: 'Avaliação Cognitiva', status: 'confirmado', color: '#10B981' },
    { id: 2, time: '11:00', end: '11:45', name: 'Sofia Martins, 8 anos', type: 'Aguardando Confirmação', status: 'aguardando', color: '#F59E0B' },
    { id: 3, time: '14:00', end: '15:00', name: 'Lucas Silva, 7 anos', type: 'Sessão Lúdica', status: 'confirmado', color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Search size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleContainer}>
        {['Dia', 'Semana', 'Mês'].map(mode => (
          <TouchableOpacity 
            key={mode} 
            style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
            onPress={() => setViewMode(mode as any)}
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelector} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {days.map(day => (
          <TouchableOpacity 
            key={day.number} 
            style={[styles.dayCard, selectedDay === day.number && styles.dayCardActive]}
            onPress={() => setSelectedDay(day.number)}
          >
            <Text style={[styles.dayLabel, selectedDay === day.number && styles.dayLabelActive]}>{day.label}</Text>
            <Text style={[styles.dayNumber, selectedDay === day.number && styles.dayNumberActive]}>{day.number}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.appointmentList} contentContainerStyle={{ paddingBottom: 100 }}>
        {appointments.map((app, index) => (
          <View key={app.id}>
            {index === 2 && (
              <View style={styles.divider}>
                <Text style={styles.dividerText}>🍴 Intervalo</Text>
              </View>
            )}
            <View style={styles.appointmentCard}>
              <View style={[styles.cardBorder, { backgroundColor: app.color }]} />
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{app.time}</Text>
                <Text style={styles.timeEnd}>{app.end}</Text>
              </View>
              <View style={styles.avatarPlaceholder} />
              <View style={styles.infoCol}>
                <Text style={styles.appName}>{app.name}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: app.status === 'confirmado' ? '#10B981' : '#D1D5DB' }]} />
                  <Text style={styles.appType}>{app.type}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Plus size={32} color="#181c1c" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#084D48' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  iconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  toggleContainer: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleText: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },
  toggleTextActive: { color: '#084D48' },
  dateSelector: { maxHeight: 90, marginBottom: 24 },
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
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16 },
  infoCol: { flex: 1 },
  appName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  appType: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  dividerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC857', alignItems: 'center', justifyContent: 'center', elevation: 8 }
});
