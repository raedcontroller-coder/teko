import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Sparkles, Activity, Camera, Zap, PlayCircle, X, Calendar, Clock, BarChart2, CheckCircle2, Crosshair } from 'lucide-react-native';
import { api } from '../../../services/api';
import { theme } from '../../../theme/theme';
import { useTranslation } from '../../../i18n';

const { width } = Dimensions.get('window');

const GAMES = [
  { id: 'fotografo', labelKey: 'fotografo', subKey: 'fotografoSub', icon: Camera, color: '#7C3AED' },
  { id: 'goleiro', labelKey: 'goleiro', subKey: 'goleiroSub', icon: Activity, color: theme.colors.primary },
  { id: 'toca_rapido', labelKey: 'tocaRapido', subKey: 'tocaRapidoSub', icon: Zap, color: '#D97706' },
];

interface EvolucaoTabProps {
  patientId?: string;
  adminPsicologoId?: string;
}

export function EvolucaoTab({ patientId, adminPsicologoId }: EvolucaoTabProps) {
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<'fotografo' | 'goleiro' | 'toca_rapido'>('fotografo');
  const [loading, setLoading] = useState<boolean>(true);
  const [evolutionData, setEvolutionData] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  useEffect(() => {
    const fetchEvolution = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const url = adminPsicologoId 
          ? `/api/patients/${patientId}/evolution?psicologoId=${adminPsicologoId}`
          : `/api/patients/${patientId}/evolution`;
        const res = await api.get(url);
        if (res.data?.success) {
          setEvolutionData(res.data.data);
        }
      } catch (err) {
        console.error("Erro ao buscar evolução do paciente:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvolution();
  }, [patientId, adminPsicologoId]);

  // Configuração Base do Gráfico (Area Chart, Bezier, Grids Transparentes)
  const getChartConfig = (color: string, dataLength: number = 4) => ({
    curved: true,
    isAnimated: true,
    thickness: 4,
    dataPointsRadius: 7,
    dataPointsColor: color,
    color: color,
    textColor: theme.colors.textDark,
    textFontSize: 11,
    yAxisTextStyle: { color: theme.colors.textMuted, fontSize: 10, fontWeight: 'bold' as const },
    xAxisLabelTextStyle: { color: theme.colors.textDark, fontSize: 12, marginTop: 4, fontWeight: 'bold' as const },
    
    // Efeito Area Gradient
    areaChart: true,
    startFillColor: color,
    startOpacity: 0.25,
    endFillColor: color,
    endOpacity: 0.02,
    
    // Grids Transparentes (X e Y)
    hideRules: false,
    rulesType: 'solid' as const,
    rulesColor: theme.colors.cardBorder,
    showVerticalLines: true,
    verticalLinesColor: theme.colors.cardBorder,
    yAxisColor: theme.colors.cardBorder,
    xAxisColor: theme.colors.cardBorder,
    yAxisThickness: 1,
    xAxisThickness: 1,
    
    initialSpacing: 24,
    spacing: Math.max(45, (width - 120) / Math.max(1, dataLength - 1)),
    height: 180,
    noOfSections: 4,
    onPress: (item: any, index: number) => {
      setSelectedPoint({ item, index, gameKey: selectedGame });
    }
  });

  const currentGameData = evolutionData ? evolutionData[selectedGame] : null;
  const currentSessionsCount = currentGameData?.chartData?.length || 0;
  const hasEnoughData = currentGameData?.hasEnoughData || false;

  const currentGameConfig = GAMES.find(g => g.id === selectedGame);

  return (
    <View style={styles.container}>
      
      {/* SELETOR DE JOGOS (Pills) */}
      <View style={styles.selectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {GAMES.map((game) => {
            const isSelected = selectedGame === game.id;
            const Icon = game.icon;
            const label = t.evolucao[game.labelKey as keyof typeof t.evolucao] || game.id;
            return (
              <TouchableOpacity
                key={game.id}
                activeOpacity={0.7}
                onPress={() => setSelectedGame(game.id as any)}
                style={[
                  styles.pillBtn,
                  isSelected 
                    ? { backgroundColor: game.color, borderColor: game.color } 
                    : { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }
                ]}
              >
                <Icon size={16} color={isSelected ? '#FFFFFF' : theme.colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.pillText, isSelected ? { color: '#FFFFFF', fontWeight: 'bold' } : { color: theme.colors.textDark }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t.evolucao.loadingTelemetry}</Text>
          </View>
        ) : !hasEnoughData ? (
          /* ESTADO CONDICIONAL: MENOS DE 3 PARTIDAS (Gráfico Oculto) */
          <View style={styles.insufficientCard}>
            <View style={styles.insufficientIconBg}>
              <PlayCircle size={36} color={theme.colors.primary} />
            </View>
            <Text style={styles.insufficientTitle}>{t.evolucao.chartBuilding}</Text>
            <Text style={styles.insufficientSub}>
              {t.evolucao.insufficientText}
            </Text>

            <View style={styles.progressTracker}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>{t.evolucao.progressLabel}</Text>
                <Text style={styles.progressCount}>{currentSessionsCount} / 3</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, (currentSessionsCount / 3) * 100)}%` }]} />
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* VIEW CONDICIONAL: FOTÓGRAFO DA FLORESTA */}
            {selectedGame === 'fotografo' && (
              <View style={styles.gameSection}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.headerIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.3)' }]}>
                    <Camera color="#7C3AED" size={22} />
                  </View>
                  <View style={styles.headerTitleCol}>
                    <Text style={styles.gameTitle}>{t.evolucao.fotografo}</Text>
                    <Text style={styles.gameSubtitle}>{t.evolucao.fotografoSub}</Text>
                  </View>
                </View>

                <View style={[styles.chartCard, { borderColor: 'rgba(124, 58, 237, 0.3)' }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t.evolucao.initialVariationSession1}</Text>
                      <Text style={styles.statValue}>
                        {currentGameData.stats?.firstVal}<Text style={styles.statUnit}> ms</Text>
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t('evolucao.currentVariationSession', { count: currentSessionsCount })}</Text>
                      <Text style={[styles.statValueHighlight, { color: '#7C3AED' }]}>
                        {currentGameData.stats?.lastVal}
                        <Text style={[styles.statUnitHighlight, { color: '#7C3AED' }]}> ms</Text>
                      </Text>
                    </View>
                  </View>

                  {/* RÓTULOS DOS EIXOS Y E X */}
                  <Text style={styles.axisYLabel}>{t.evolucao.yAxisTime}</Text>
                  
                  <View style={styles.chartWrapper}>
                    <LineChart 
                      data={currentGameData.chartData} 
                      {...getChartConfig('#7C3AED', currentGameData.chartData.length)} 
                    />
                  </View>

                  <Text style={styles.axisXLabel}>{t.evolucao.xAxisSessions}</Text>

                  <View style={[styles.aiCard, { backgroundColor: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.2)' }]}>
                    <View style={[styles.aiIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
                      <Sparkles color="#7C3AED" size={16} />
                    </View>
                    <View style={styles.aiTextCol}>
                      <Text style={[styles.aiTitle, { color: '#7C3AED' }]}>{t.evolucao.aiAnalysisTitle}</Text>
                      <Text style={styles.aiDesc}>{currentGameData.aiAnalysis}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* VIEW CONDICIONAL: JOGO DO GOLEIRO */}
            {selectedGame === 'goleiro' && (
              <View style={styles.gameSection}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.headerIconBox, { backgroundColor: `${theme.colors.primary}18`, borderColor: `${theme.colors.primary}35` }]}>
                    <Activity color={theme.colors.primary} size={22} />
                  </View>
                  <View style={styles.headerTitleCol}>
                    <Text style={styles.gameTitle}>{t.evolucao.goleiro}</Text>
                    <Text style={styles.gameSubtitle}>{t.evolucao.goleiroSub}</Text>
                  </View>
                </View>

                <View style={[styles.chartCard, { borderColor: `${theme.colors.primary}40` }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t.evolucao.initialOscillationSession1}</Text>
                      <Text style={styles.statValue}>
                        {currentGameData.stats?.firstVal}<Text style={styles.statUnit}> ms</Text>
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t('evolucao.currentOscillationSession', { count: currentSessionsCount })}</Text>
                      <Text style={[styles.statValueHighlight, { color: theme.colors.primary }]}>
                        {currentGameData.stats?.lastVal}
                        <Text style={[styles.statUnitHighlight, { color: theme.colors.primary }]}> ms</Text>
                      </Text>
                    </View>
                  </View>

                  {/* RÓTULOS DOS EIXOS Y E X */}
                  <Text style={styles.axisYLabel}>{t.evolucao.yAxisTime}</Text>

                  <View style={styles.chartWrapper}>
                    <LineChart 
                      data={currentGameData.chartData} 
                      {...getChartConfig(theme.colors.primary, currentGameData.chartData.length)} 
                    />
                  </View>

                  <Text style={styles.axisXLabel}>{t.evolucao.xAxisSessions}</Text>

                  <View style={[styles.aiCard, { backgroundColor: `${theme.colors.primary}10`, borderColor: `${theme.colors.primary}25` }]}>
                    <View style={[styles.aiIconBox, { backgroundColor: `${theme.colors.primary}20` }]}>
                      <Sparkles color={theme.colors.primary} size={16} />
                    </View>
                    <View style={styles.aiTextCol}>
                      <Text style={[styles.aiTitle, { color: theme.colors.primary }]}>{t.evolucao.aiAnalysisTitle}</Text>
                      <Text style={styles.aiDesc}>{currentGameData.aiAnalysis}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* VIEW CONDICIONAL: TOCA RÁPIDO */}
            {selectedGame === 'toca_rapido' && (
              <View style={styles.gameSection}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.headerIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.15)', borderColor: 'rgba(217, 119, 6, 0.3)' }]}>
                    <Zap color="#D97706" size={22} />
                  </View>
                  <View style={styles.headerTitleCol}>
                    <Text style={styles.gameTitle}>{t.evolucao.tocaRapido}</Text>
                    <Text style={styles.gameSubtitle}>{t.evolucao.tocaRapidoSub}</Text>
                  </View>
                </View>

                <View style={[styles.chartCard, { borderColor: 'rgba(217, 119, 6, 0.3)' }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t.evolucao.initialImproperHitsSession1}</Text>
                      <Text style={styles.statValue}>
                        {currentGameData.stats?.firstVal}<Text style={styles.statUnit}> {t.evolucao.improperHits}</Text>
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t('evolucao.currentImproperHitsSession', { count: currentSessionsCount })}</Text>
                      <Text style={[styles.statValueHighlight, { color: '#D97706' }]}>
                        {currentGameData.stats?.lastVal}
                        <Text style={[styles.statUnitHighlight, { color: '#D97706' }]}> {t.evolucao.improperHits}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* RÓTULOS DOS EIXOS Y E X */}
                  <Text style={styles.axisYLabel}>{t.evolucao.yAxisImproperHits}</Text>

                  <View style={styles.chartWrapper}>
                    <LineChart 
                      data={currentGameData.chartData} 
                      {...getChartConfig('#D97706', currentGameData.chartData.length)} 
                    />
                  </View>

                  <Text style={styles.axisXLabel}>{t.evolucao.xAxisSessions}</Text>

                  <View style={[styles.aiCard, { backgroundColor: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.2)' }]}>
                    <View style={[styles.aiIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.15)' }]}>
                      <Sparkles color="#D97706" size={16} />
                    </View>
                    <View style={styles.aiTextCol}>
                      <Text style={[styles.aiTitle, { color: '#D97706' }]}>{t.evolucao.aiAnalysisTitle}</Text>
                      <Text style={styles.aiDesc}>{currentGameData.aiAnalysis}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* POPUP TRANSLÚCIDO GLASSMORPHIC PARA DETALHAMENTO DA TELEMETRIA */}
      <Modal
        visible={!!selectedPoint}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPoint(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPoint(null)}
        >
          {selectedPoint && (
            <TouchableOpacity 
              activeOpacity={1} 
              style={[
                styles.glassModalCard, 
                { borderColor: currentGameConfig?.color || theme.colors.cardBorder }
              ]}
            >
              {/* CABEÇALHO DO MODAL */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalBadge, { backgroundColor: `${currentGameConfig?.color}15` }]}>
                    <Text style={[styles.modalBadgeText, { color: currentGameConfig?.color }]}>
                      {t.evolucao.session} #{selectedPoint.item?.label}
                    </Text>
                  </View>
                  <Text style={styles.modalGameLabel}>
                    {currentGameConfig ? (t.evolucao[currentGameConfig.labelKey as keyof typeof t.evolucao] || currentGameConfig.id) : ''}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedPoint(null)} 
                  style={styles.closeBtn}
                >
                  <X size={20} color={theme.colors.textDark} />
                </TouchableOpacity>
              </View>

              {/* DATA E HORA DE REALIZAÇÃO */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{selectedPoint.item?.date || t.evolucao.dateNA}</Text>
                </View>
                {!!selectedPoint.item?.formattedTime && (
                  <View style={styles.metaItem}>
                    <Clock size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>{selectedPoint.item?.formattedTime}</Text>
                  </View>
                )}
              </View>

              {/* MÉTRICA PRINCIPAL DO PONTO */}
              <View style={[styles.primaryMetricCard, { backgroundColor: `${currentGameConfig?.color}10` }]}>
                <Text style={styles.primaryMetricLabel}>{t.evolucao.matchResult}</Text>
                <Text style={[styles.primaryMetricValue, { color: currentGameConfig?.color }]}>
                  {selectedPoint.item?.rawVal}{' '}
                  <Text style={styles.primaryMetricUnit}>
                    {selectedGame === 'toca_rapido' ? t.evolucao.improperHits : 'ms'}
                  </Text>
                </Text>
              </View>

              {/* DETALHAMENTO DA TELEMETRIA REAL (DO BANCO DE DADOS) */}
              <Text style={styles.detailsHeaderTitle}>{t.evolucao.matchDetails}</Text>
              <View style={styles.detailsGrid}>
                {selectedGame === 'goleiro' && (
                  <>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>{t.evolucao.responseOscillation}</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.vtr_ms ?? selectedPoint.item?.rawVal} ms
                      </Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>{t.evolucao.reactionAverage}</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.media_reacao_ms ?? 'N/A'} ms
                      </Text>
                    </View>
                  </>
                )}

                {selectedGame === 'fotografo' && (
                  <>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>{t.evolucao.focusVariation}</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.variacao ?? selectedPoint.item?.rawVal} ms
                      </Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>{t.evolucao.phaseTime}</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.tempo_fase_1 ? `${selectedPoint.item?.details?.tempo_fase_1}ms` : t.evolucao.recorded}
                      </Text>
                    </View>
                  </>
                )}

                {selectedGame === 'toca_rapido' && (
                  <>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>{t.evolucao.improperHits}</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.erro_nogo ?? selectedPoint.item?.rawVal} {t.evolucao.hitCount}
                      </Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>{t.evolucao.correctHits}</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.acertos_go ?? selectedPoint.item?.details?.correctHits ?? selectedPoint.item?.details?.hits ?? selectedPoint.item?.details?.acertos ?? 0} {t.evolucao.hitCount}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.dismissBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => setSelectedPoint(null)}
              >
                <Text style={styles.dismissBtnText}>{t.evolucao.understood}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  
  // Selector Styles
  selectorContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    marginBottom: 16,
  },
  selectorScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  gameSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: { flex: 1 },
  gameTitle: { color: theme.colors.textDark, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  gameSubtitle: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 1 },
  
  chartCard: { 
    backgroundColor: theme.colors.cardBg, 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1,
  },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: theme.colors.bg, borderRadius: 16, padding: 16, marginRight: 12, borderWidth: 1, borderColor: theme.colors.cardBorder },
  statBoxFull: { flex: 1, backgroundColor: theme.colors.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.cardBorder },
  statLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { color: theme.colors.textDark, fontSize: 26, fontWeight: '900' },
  statUnit: { fontSize: 15, color: theme.colors.textMuted, fontWeight: 'normal' },
  statValueHighlight: { fontSize: 26, fontWeight: '900' },
  statUnitHighlight: { fontSize: 15, fontWeight: 'normal' },
  
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreValue: { fontSize: 36, fontWeight: '900' },
  trendPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  trendText: { fontWeight: 'bold', fontSize: 14 },
  
  axisYLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  axisXLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },

  chartWrapper: { 
    alignItems: 'center', 
    marginVertical: 8,
    marginLeft: -10,
  },
  
  aiCard: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginTop: 12 
  },
  aiIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  aiTextCol: { flex: 1 },
  aiTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiDesc: { color: theme.colors.textDark, fontSize: 14, lineHeight: 22 },

  loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textMuted, marginTop: 12, fontSize: 15 },
  
  // Card para menos de 3 partidas
  insufficientCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    marginVertical: 12,
  },
  insufficientIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  insufficientTitle: { color: theme.colors.textDark, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  insufficientSub: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },

  // Teko Style Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalGameLabel: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.bg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  primaryMetricCard: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  primaryMetricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  primaryMetricValue: {
    fontSize: 34,
    fontWeight: '900',
  },
  primaryMetricUnit: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: 'normal',
  },
  detailsHeaderTitle: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailsGrid: {
    gap: 10,
    marginBottom: 24,
  },
  detailGridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 12,
  },
  detailItemLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  detailItemValue: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
  dismissBtn: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  
  // Progress tracker styles para o card de menos de 3 partidas
  progressTracker: { width: '100%', backgroundColor: theme.colors.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.cardBorder },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  progressCount: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
  progressBarTrack: { height: 8, backgroundColor: theme.colors.cardBorder, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
});

