import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Sparkles, Activity, Camera, Zap, PlayCircle, X, Calendar, Clock, BarChart2, CheckCircle2, Crosshair } from 'lucide-react-native';
import { api } from '../../../services/api';

const { width } = Dimensions.get('window');

const GAMES = [
  { id: 'fotografo', label: 'Fotógrafo', subtitle: 'Variação de Foco (ms)', icon: Camera, color: '#7B61FF' },
  { id: 'goleiro', label: 'Goleiro', subtitle: 'Tempo de Reação (ms)', icon: Activity, color: '#64C6BE' },
  { id: 'toca_rapido', label: 'Toca Rápido', subtitle: 'Controle de Impulsividade', icon: Zap, color: '#FFC857' },
];

interface EvolucaoTabProps {
  patientId?: string;
  adminPsicologoId?: string;
}

export function EvolucaoTab({ patientId, adminPsicologoId }: EvolucaoTabProps) {
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
    textColor: '#fff',
    textFontSize: 11,
    yAxisTextStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold' as const },
    xAxisLabelTextStyle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, fontWeight: 'bold' as const },
    
    // Efeito Area Gradient
    areaChart: true,
    startFillColor: color,
    startOpacity: 0.35,
    endFillColor: color,
    endOpacity: 0.02,
    
    // Grids Transparentes (X e Y)
    hideRules: false,
    rulesType: 'solid' as const,
    rulesColor: 'rgba(255,255,255,0.06)',
    showVerticalLines: true,
    verticalLinesColor: 'rgba(255,255,255,0.06)',
    yAxisColor: 'rgba(255,255,255,0.2)',
    xAxisColor: 'rgba(255,255,255,0.2)',
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
            return (
              <TouchableOpacity
                key={game.id}
                activeOpacity={0.7}
                onPress={() => setSelectedGame(game.id as any)}
                style={[
                  styles.pillBtn,
                  isSelected 
                    ? { backgroundColor: game.color, borderColor: game.color } 
                    : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                ]}
              >
                <Icon size={16} color={isSelected ? '#000' : 'rgba(255,255,255,0.5)'} style={{ marginRight: 8 }} />
                <Text style={[styles.pillText, isSelected && { color: '#000', fontWeight: 'bold' }]}>
                  {game.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FFC857" />
            <Text style={styles.loadingText}>Carregando métricas da telemetria...</Text>
          </View>
        ) : !hasEnoughData ? (
          /* ESTADO CONDICIONAL: MENOS DE 3 PARTIDAS (Gráfico Oculto) */
          <View style={styles.insufficientCard}>
            <View style={styles.insufficientIconBg}>
              <PlayCircle size={36} color="#FFC857" />
            </View>
            <Text style={styles.insufficientTitle}>Gráfico em Construção</Text>
            <Text style={styles.insufficientSub}>
              Para construir uma linha de tendência consistente e evitar pontos isolados, são necessárias no mínimo <Text style={{ fontWeight: 'bold', color: '#FFF' }}>3 partidas ininterruptas</Text> deste jogo.
            </Text>

            <View style={styles.progressTracker}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Progresso das Partidas</Text>
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
                  <Camera color="#7B61FF" size={24} style={{ marginRight: 8 }} />
                  <Text style={styles.gameTitle}>Fotógrafo da Floresta</Text>
                </View>

                <View style={[styles.chartCard, { borderColor: 'rgba(123, 97, 255, 0.3)' }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Variação Inicial (Sessão 1)</Text>
                      <Text style={styles.statValue}>
                        {currentGameData.stats?.firstVal}<Text style={styles.statUnit}> ms</Text>
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Variação Atual (Sessão {currentSessionsCount})</Text>
                      <Text style={[styles.statValueHighlight, { color: '#7B61FF' }]}>
                        {currentGameData.stats?.lastVal}
                        <Text style={[styles.statUnitHighlight, { color: '#7B61FF' }]}> ms</Text>
                      </Text>
                    </View>
                  </View>

                  {/* RÓTULOS DOS EIXOS Y E X */}
                  <Text style={styles.axisYLabel}>▲ Tempo (MS)</Text>
                  
                  <View style={styles.chartWrapper}>
                    <LineChart 
                      data={currentGameData.chartData} 
                      {...getChartConfig('#7B61FF', currentGameData.chartData.length)} 
                    />
                  </View>

                  <Text style={styles.axisXLabel}>Sessões ►</Text>

                  <View style={[styles.aiCard, { backgroundColor: 'rgba(123, 97, 255, 0.1)', borderColor: 'rgba(123, 97, 255, 0.3)' }]}>
                    <View style={[styles.aiIconBox, { backgroundColor: 'rgba(123, 97, 255, 0.2)' }]}>
                      <Sparkles color="#7B61FF" size={16} />
                    </View>
                    <View style={styles.aiTextCol}>
                      <Text style={[styles.aiTitle, { color: '#7B61FF' }]}>Análise Assistida</Text>
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
                  <Activity color="#64C6BE" size={24} style={{ marginRight: 8 }} />
                  <Text style={styles.gameTitle}>Jogo do Goleiro</Text>
                </View>

                <View style={[styles.chartCard, { borderColor: 'rgba(100, 198, 190, 0.3)' }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Oscilação Inicial (Sessão 1)</Text>
                      <Text style={styles.statValue}>
                        {currentGameData.stats?.firstVal}<Text style={styles.statUnit}> ms</Text>
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Oscilação Atual (Sessão {currentSessionsCount})</Text>
                      <Text style={[styles.statValueHighlight, { color: '#64C6BE' }]}>
                        {currentGameData.stats?.lastVal}
                        <Text style={[styles.statUnitHighlight, { color: '#64C6BE' }]}> ms</Text>
                      </Text>
                    </View>
                  </View>

                  {/* RÓTULOS DOS EIXOS Y E X */}
                  <Text style={styles.axisYLabel}>▲ Tempo (MS)</Text>

                  <View style={styles.chartWrapper}>
                    <LineChart 
                      data={currentGameData.chartData} 
                      {...getChartConfig('#64C6BE', currentGameData.chartData.length)} 
                    />
                  </View>

                  <Text style={styles.axisXLabel}>Sessões ►</Text>

                  <View style={[styles.aiCard, { backgroundColor: 'rgba(100, 198, 190, 0.1)', borderColor: 'rgba(100, 198, 190, 0.3)' }]}>
                    <View style={[styles.aiIconBox, { backgroundColor: 'rgba(100, 198, 190, 0.2)' }]}>
                      <Sparkles color="#64C6BE" size={16} />
                    </View>
                    <View style={styles.aiTextCol}>
                      <Text style={[styles.aiTitle, { color: '#64C6BE' }]}>Análise Assistida</Text>
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
                  <Zap color="#FFC857" size={24} style={{ marginRight: 8 }} />
                  <Text style={styles.gameTitle}>Toca Rápido!</Text>
                </View>

                <View style={[styles.chartCard, { borderColor: 'rgba(255, 200, 87, 0.3)' }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Toques Indevidos Iniciais (Sessão 1)</Text>
                      <Text style={styles.statValue}>
                        {currentGameData.stats?.firstVal}<Text style={styles.statUnit}> toques</Text>
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Toques Indevidos Atuais (Sessão {currentSessionsCount})</Text>
                      <Text style={[styles.statValueHighlight, { color: '#FFC857' }]}>
                        {currentGameData.stats?.lastVal}
                        <Text style={[styles.statUnitHighlight, { color: '#FFC857' }]}> toques</Text>
                      </Text>
                    </View>
                  </View>

                  {/* RÓTULOS DOS EIXOS Y E X */}
                  <Text style={styles.axisYLabel}>▲ Toques Indevidos</Text>

                  <View style={styles.chartWrapper}>
                    <LineChart 
                      data={currentGameData.chartData} 
                      {...getChartConfig('#FFC857', currentGameData.chartData.length)} 
                    />
                  </View>

                  <Text style={styles.axisXLabel}>Sessões ►</Text>

                  <View style={[styles.aiCard, { backgroundColor: 'rgba(255, 200, 87, 0.1)', borderColor: 'rgba(255, 200, 87, 0.3)' }]}>
                    <View style={[styles.aiIconBox, { backgroundColor: 'rgba(255, 200, 87, 0.2)' }]}>
                      <Sparkles color="#FFC857" size={16} />
                    </View>
                    <View style={styles.aiTextCol}>
                      <Text style={[styles.aiTitle, { color: '#FFC857' }]}>Análise Assistida</Text>
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
                { borderColor: currentGameConfig?.color || 'rgba(255,255,255,0.2)' }
              ]}
            >
              {/* CABEÇALHO DO MODAL */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalBadge, { backgroundColor: `${currentGameConfig?.color}25` }]}>
                    <Text style={[styles.modalBadgeText, { color: currentGameConfig?.color }]}>
                      Sessão #{selectedPoint.item?.label}
                    </Text>
                  </View>
                  <Text style={styles.modalGameLabel}>{currentGameConfig?.label}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedPoint(null)} 
                  style={styles.closeBtn}
                >
                  <X size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>

              {/* DATA E HORA DE REALIZAÇÃO */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{selectedPoint.item?.date || 'Data N/A'}</Text>
                </View>
                {!!selectedPoint.item?.formattedTime && (
                  <View style={styles.metaItem}>
                    <Clock size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>{selectedPoint.item?.formattedTime}</Text>
                  </View>
                )}
              </View>

              {/* MÉTRICA PRINCIPAL DO PONTO */}
              <View style={[styles.primaryMetricCard, { backgroundColor: `${currentGameConfig?.color}15` }]}>
                <Text style={styles.primaryMetricLabel}>Resultado da Partida</Text>
                <Text style={[styles.primaryMetricValue, { color: currentGameConfig?.color }]}>
                  {selectedPoint.item?.rawVal}{' '}
                  <Text style={styles.primaryMetricUnit}>
                    {selectedGame === 'toca_rapido' ? 'toques indevidos' : 'ms'}
                  </Text>
                </Text>
              </View>

              {/* DETALHAMENTO DA TELEMETRIA REAL (DO BANCO DE DADOS) */}
              <Text style={styles.detailsHeaderTitle}>Detalhamento da Partida</Text>
              <View style={styles.detailsGrid}>
                {selectedGame === 'goleiro' && (
                  <>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>Oscilação da Resposta</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.vtr_ms ?? selectedPoint.item?.rawVal} ms
                      </Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>Média de Reação</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.media_reacao_ms ?? 'N/A'} ms
                      </Text>
                    </View>
                  </>
                )}

                {selectedGame === 'fotografo' && (
                  <>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>Variação do Foco</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.variacao ?? selectedPoint.item?.rawVal} ms
                      </Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>Tempo Fase 1 / Fase 2</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.tempo_fase_1 ? `${selectedPoint.item?.details?.tempo_fase_1}ms` : 'Registrado'}
                      </Text>
                    </View>
                  </>
                )}

                {selectedGame === 'toca_rapido' && (
                  <>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>Toques Indevidos</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.erro_nogo ?? selectedPoint.item?.rawVal} toque(s)
                      </Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailItemLabel}>Toques Corretos</Text>
                      <Text style={styles.detailItemValue}>
                        {selectedPoint.item?.details?.acertos_go ?? selectedPoint.item?.details?.correctHits ?? selectedPoint.item?.details?.hits ?? selectedPoint.item?.details?.acertos ?? 0} toque(s)
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.dismissBtn, { backgroundColor: '#FFC857' }]}
                onPress={() => setSelectedPoint(null)}
              >
                <Text style={styles.dismissBtnText}>Entendido</Text>
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  gameSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  gameTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  chartCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1,
  },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginRight: 12 },
  statBoxFull: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  statValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  statUnit: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 'normal' },
  statValueHighlight: { fontSize: 28, fontWeight: '900' },
  statUnitHighlight: { fontSize: 16, fontWeight: 'normal' },
  
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreValue: { fontSize: 36, fontWeight: '900' },
  trendPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  trendText: { fontWeight: 'bold', fontSize: 14 },
  
  axisYLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  axisXLabel: {
    color: 'rgba(255,255,255,0.6)',
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
  aiTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  aiDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 },

  loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 15 },
  
  // Card para menos de 3 partidas
  insufficientCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.3)',
    alignItems: 'center',
    marginVertical: 12,
  },
  insufficientIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 200, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.3)',
  },
  insufficientTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  insufficientSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  // Teko Style Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 28, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#122523',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
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
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  primaryMetricCard: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryMetricLabel: {
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'normal',
  },
  detailsHeaderTitle: {
    color: '#FFC857',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  detailItemLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  detailItemValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dismissBtn: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissBtnText: {
    color: '#084D48',
    fontWeight: 'bold',
    fontSize: 15,
  },
  
  // Progress tracker styles para o card de menos de 3 partidas
  progressTracker: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  progressCount: { color: '#FFC857', fontSize: 14, fontWeight: 'bold' },
  progressBarTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFC857', borderRadius: 4 },
});
