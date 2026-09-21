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
import { Search, Download, UserCircle, Briefcase, AtSign, Fingerprint } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

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
  alunoTdah: string;
  vtri: string;
  qa: string;
  imp: string;
}

export const AdminReportsScreen: React.FC = () => {
  const { t } = useTranslation();
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
          <Fingerprint color={theme.colors.badgePurpleText} size={20} />
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Responsável */}
        <View style={styles.dataRow}>
          <UserCircle color={theme.colors.textMuted} size={16} />
          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>Responsável</Text>
            <Text style={styles.dataValue}>{item.guardianName}</Text>
            <Text style={styles.dataSubValue}>{item.guardianPhone}</Text>
          </View>
        </View>

        {/* Profissional */}
        <View style={styles.dataRow}>
          <Briefcase color={theme.colors.textMuted} size={16} />
          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>Profissional</Text>
            <Text style={styles.dataValue}>{item.psicologoName}</Text>
            <Text style={styles.dataSubValue}>{item.psicologoClinic || 'Sem clínica'}</Text>
          </View>
        </View>

        {/* Contato Profissional */}
        <View style={styles.dataRow}>
          <AtSign color={theme.colors.textMuted} size={16} />
          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>Contato (Profissional)</Text>
            <Text style={styles.dataValue}>{item.psicologoEmail}</Text>
            <Text style={styles.dataSubValue}>CRP: {item.psicologoCrp || 'Não informado'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metricBadge}>
          <Text style={styles.metricLabel}>TDAH</Text>
          <Text style={[styles.metricValue, item.alunoTdah === 'Sim' && { color: theme.colors.primary }]}>{item.alunoTdah}</Text>
        </View>
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
        <Text style={styles.title}>{t.admin.reportsTitle}</Text>
        <Text style={styles.subtitle}>{t.admin.reportsSubtitle}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.admin.searchReportsPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
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
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Download color="#FFFFFF" size={18} />
              <Text style={styles.exportButtonText}>{t.admin.exportCsv}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.admin.noRecordsFound}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 16,
    height: 46,
    ...theme.shadows.subtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 14,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    height: 46,
    gap: 8,
    ...theme.shadows.subtle,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.badgePurple,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  childInfoContainer: {
    flex: 1,
  },
  childName: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: '800',
  },
  childMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dataTextContainer: {
    flex: 1,
  },
  dataLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dataValue: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  dataSubValue: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    justifyContent: 'space-around',
  },
  metricBadge: {
    alignItems: 'center',
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricValue: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: theme.colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
});

