import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Sparkles, MoreHorizontal, Edit3, Trash2, X } from 'lucide-react-native';

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

export function DailyView({ selectedDate, appointments, holidays = [], onEdit, onDelete }: DailyViewProps) {
  const [optionsApp, setOptionsApp] = useState<Appointment | null>(null);
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
                <MoreHorizontal size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        ))}
        {todaysAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sem agendamentos para este dia.</Text>
          </View>
        )}
      </ScrollView>

      {/* OPTIONS MODAL (Teko Translucent Options Style) */}
      <Modal visible={!!optionsApp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setOptionsApp(null)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <View style={[styles.optionsModalContent, { borderColor: optionsApp ? `${optionsApp.color}50` : 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções do Agendamento</Text>
              <TouchableOpacity onPress={() => setOptionsApp(null)} style={styles.closeBtn}>
                <X size={22} color="#fff" />
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
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(255, 200, 87, 0.1)', borderColor: 'rgba(255, 200, 87, 0.3)' }]}>
                <Edit3 size={22} color="#FFC857" />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={styles.optionTitle}>Editar Agendamento</Text>
                <Text style={styles.optionDesc}>Altere o horário, paciente, título ou cor da consulta.</Text>
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
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.3)' }]}>
                <Trash2 size={22} color="#F87171" />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={[styles.optionTitle, { color: '#F87171' }]}>Excluir Agendamento</Text>
                <Text style={styles.optionDesc}>Remova permanentemente este agendamento da agenda.</Text>
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
  sectionTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 24, marginBottom: 16, textTransform: 'capitalize' },
  holidayBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(123, 97, 255, 0.1)', marginHorizontal: 24, marginBottom: 20, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(123, 97, 255, 0.3)' },
  holidayIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(123, 97, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  holidayBannerTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  holidayBannerText: { color: '#B4A2FF', fontWeight: 'bold', fontSize: 16 },
  appointmentList: { paddingHorizontal: 24 },
  appointmentCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginBottom: 16, padding: 16, alignItems: 'center', overflow: 'hidden' },
  cardBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  threeDotsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
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

  /* Options Modal Styles */
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', padding: 24 },
  modalBackground: { ...StyleSheet.absoluteFillObject },
  optionsModalContent: {
    width: '100%',
    backgroundColor: '#1c2222',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  closeBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionCardDanger: {
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextColumn: { flex: 1 },
  optionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  optionDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
});
