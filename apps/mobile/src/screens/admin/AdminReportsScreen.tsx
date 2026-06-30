import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Search, Download, UserCircle, Briefcase, Phone, AtSign, Fingerprint } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from '../../services/api';

interface DadosRow {
  id: string;
  psicologoName: string;
  psicologoEmail: string;
  psicologoCrp: string;
  psicologoClinic: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  alunoName: string;
  alunoAge: string;
  alunoGender: string;
  vtri: string;
  qa: string;
  imp: string;
}

export const AdminReportsScreen: React.FC = () => {
  const [data, setData] = useState<DadosRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/api/admin/reports');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((row) => {
    const searchString = `${row.psicologoName} ${row.alunoName} ${row.guardianName} ${row.psicologoClinic}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get('/api/admin/reports/export');
      
      if (response.data.success && response.data.csv) {
        const csvString = response.data.csv;
        const filename = `dados_gerados_${new Date().toISOString().split('T')[0]}.csv`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(fileUri, csvString);
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Dados Gerados'
          });
        } else {
          Alert.alert('Aviso', 'O compartilhamento não está disponível neste dispositivo.');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || String(error);
      console.error('Erro de exportação:', errorMessage);
      Alert.alert('Erro', `Não foi possível exportar os dados.\nDetalhe: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  const renderCard = ({ item }: { item: DadosRow }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.childInfoContainer}>
          <Text style={styles.childName}>{item.alunoName}</Text>
          <Text style={styles.childMeta}>{item.alunoAge} anos • {item.alunoGender}</Text>
        </View>
        <View style={styles.iconBadge}>
          <Fingerprint color="#7B61FF" size={20} />
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Responsável */}
        <View style={styles.dataRow}>
          <UserCircle color="#FFF" size={16} style={{ opacity: 0.5 }} />
          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>Responsável</Text>
            <Text style={styles.dataValue}>{item.guardianName}</Text>
            <Text style={styles.dataSubValue}>{item.guardianPhone}</Text>
          </View>
        </View>

        {/* Psicólogo */}
        <View style={styles.dataRow}>
          <Briefcase color="#FFF" size={16} style={{ opacity: 0.5 }} />
          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>Psicólogo(a)</Text>
            <Text style={styles.dataValue}>{item.psicologoName}</Text>
            <Text style={styles.dataSubValue}>{item.psicologoClinic || 'Sem clínica'}</Text>
          </View>
        </View>

        {/* Contato Psi */}
        <View style={styles.dataRow}>
          <AtSign color="#FFF" size={16} style={{ opacity: 0.5 }} />
          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>Contato (Psi)</Text>
            <Text style={styles.dataValue}>{item.psicologoEmail}</Text>
            <Text style={styles.dataSubValue}>CRP: {item.psicologoCrp || 'Não informado'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metricBadge}>
          <Text style={styles.metricLabel}>VTRI</Text>
          <Text style={styles.metricValue}>{item.vtri}</Text>
        </View>
        <View style={styles.metricBadge}>
          <Text style={styles.metricLabel}>QA</Text>
          <Text style={styles.metricValue}>{item.qa}</Text>
        </View>
        <View style={styles.metricBadge}>
          <Text style={styles.metricLabel}>IMP</Text>
          <Text style={styles.metricValue}>{item.imp}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Dados Gerados</Text>
        <Text style={styles.subtitle}>Extraia relatórios brutos da plataforma</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search color="rgba(255,255,255,0.4)" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar (criança, responsável, psicólogo...)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#084D48" size="small" />
          ) : (
            <>
              <Download color="#084D48" size={20} />
              <Text style={styles.exportButtonText}>Exportar (CSV)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFC857" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC857',
    borderRadius: 12,
    height: 50,
    gap: 8,
  },
  exportButtonText: {
    color: '#084D48',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#084D48',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  childInfoContainer: {
    flex: 1,
  },
  childName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  childMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 2,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
    gap: 16,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dataTextContainer: {
    flex: 1,
  },
  dataLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dataValue: {
    color: '#FFF',
    fontSize: 15,
  },
  dataSubValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-around',
  },
  metricBadge: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#FFC857',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
  },
});
