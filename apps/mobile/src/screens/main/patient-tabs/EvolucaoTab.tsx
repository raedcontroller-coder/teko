import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Sparkles, Activity, Camera, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const GAMES = [
  { id: 'fotografo', label: 'Fotógrafo', subtitle: 'Desempenho Visual', icon: Camera, color: '#7B61FF' },
  { id: 'goleiro', label: 'Goleiro', subtitle: 'Tempo de Reação - VTR', icon: Activity, color: '#64C6BE' },
  { id: 'toca_rapido', label: 'Toca Rápido', subtitle: 'Agilidade Motora', icon: Zap, color: '#FFC857' },
];

export function EvolucaoTab() {
  const [selectedGame, setSelectedGame] = useState('fotografo');

  // Dados Mockados para os gráficos
  const dvData = [
    { value: 45, label: 'S1' },
    { value: 58, label: 'S2' },
    { value: 72, label: 'S3' },
    { value: 85, label: 'S4' },
  ];

  const vtrData = [
    { value: 245, label: 'S1' },
    { value: 220, label: 'S2' },
    { value: 195, label: 'S3' },
    { value: 182, label: 'S4' },
  ];

  const tocaData = [
    { value: 30, label: 'S1' },
    { value: 38, label: 'S2' },
    { value: 48, label: 'S3' },
    { value: 65, label: 'S4' },
  ];

  // Configuração Base do Gráfico (Area Chart, Bezier, Grids Transparentes)
  const getChartConfig = (color: string) => ({
    curved: true,
    isAnimated: true,
    thickness: 4,
    dataPointsRadius: 6,
    dataPointsColor: color,
    color: color,
    textColor: '#fff',
    textFontSize: 10,
    yAxisTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    xAxisLabelTextStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
    
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
    
    initialSpacing: 20,
    spacing: (width - 100) / 3, // Calcula o espaçamento perfeitamente para 4 pontos na tela
    height: 180,
    noOfSections: 4,
  });

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
                onPress={() => setSelectedGame(game.id)}
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
        
        {/* VIEW CONDICIONAL: FOTÓGRAFO DA FLORESTA */}
        {selectedGame === 'fotografo' && (
          <View style={styles.gameSection}>
            <View style={styles.sectionHeader}>
              <Camera color="#7B61FF" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.gameTitle}>Fotógrafo da Floresta</Text>
            </View>

            <View style={[styles.chartCard, { borderColor: 'rgba(123, 97, 255, 0.3)' }]}>
              <View style={styles.statsRow}>
                <View style={styles.statBoxFull}>
                  <Text style={styles.statLabel}>Aproveitamento Máximo Alcançado</Text>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreValue, { color: '#7B61FF' }]}>85%</Text>
                    <View style={[styles.trendPill, { backgroundColor: 'rgba(123, 97, 255, 0.15)' }]}>
                      <Text style={[styles.trendText, { color: '#7B61FF' }]}>↗ +12%</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.chartWrapper}>
                <LineChart data={dvData} {...getChartConfig('#7B61FF')} />
              </View>

              <View style={[styles.aiCard, { backgroundColor: 'rgba(123, 97, 255, 0.1)', borderColor: 'rgba(123, 97, 255, 0.3)' }]}>
                <View style={[styles.aiIconBox, { backgroundColor: 'rgba(123, 97, 255, 0.2)' }]}>
                  <Sparkles color="#7B61FF" size={16} />
                </View>
                <View style={styles.aiTextCol}>
                  <Text style={[styles.aiTitle, { color: '#7B61FF' }]}>Análise Assistida</Text>
                  <Text style={styles.aiDesc}>
                    O desempenho visual vem subindo consistentemente desde a Sessão 1. A precisão na identificação de animais camuflados aumentou significativamente.
                  </Text>
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
                  <Text style={styles.statLabel}>VTR Inicial (S1)</Text>
                  <Text style={styles.statValue}>245<Text style={styles.statUnit}> ms</Text></Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>VTR Atual (S4)</Text>
                  <Text style={[styles.statValueHighlight, { color: '#64C6BE' }]}>182<Text style={[styles.statUnitHighlight, { color: '#64C6BE' }]}> ms ↘</Text></Text>
                </View>
              </View>

              <View style={styles.chartWrapper}>
                <LineChart data={vtrData} {...getChartConfig('#64C6BE')} />
              </View>

              <View style={[styles.aiCard, { backgroundColor: 'rgba(100, 198, 190, 0.1)', borderColor: 'rgba(100, 198, 190, 0.3)' }]}>
                <View style={[styles.aiIconBox, { backgroundColor: 'rgba(100, 198, 190, 0.2)' }]}>
                  <Sparkles color="#64C6BE" size={16} />
                </View>
                <View style={styles.aiTextCol}>
                  <Text style={[styles.aiTitle, { color: '#64C6BE' }]}>Análise Assistida</Text>
                  <Text style={styles.aiDesc}>
                    O tempo de reação variável (VTR) demonstrou forte estabilização. Uma redução de ms como esta indica clara melhora no controle inibitório e atenção focada.
                  </Text>
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
                <View style={styles.statBoxFull}>
                  <Text style={styles.statLabel}>Total de Acertos Consecutivos (Combo)</Text>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreValue, { color: '#FFC857' }]}>65</Text>
                    <View style={[styles.trendPill, { backgroundColor: 'rgba(255, 200, 87, 0.15)' }]}>
                      <Text style={[styles.trendText, { color: '#FFC857' }]}>↗ +17</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.chartWrapper}>
                <LineChart data={tocaData} {...getChartConfig('#FFC857')} />
              </View>

              <View style={[styles.aiCard, { backgroundColor: 'rgba(255, 200, 87, 0.1)', borderColor: 'rgba(255, 200, 87, 0.3)' }]}>
                <View style={[styles.aiIconBox, { backgroundColor: 'rgba(255, 200, 87, 0.2)' }]}>
                  <Sparkles color="#FFC857" size={16} />
                </View>
                <View style={styles.aiTextCol}>
                  <Text style={[styles.aiTitle, { color: '#FFC857' }]}>Análise Assistida</Text>
                  <Text style={styles.aiDesc}>
                    Um pico excepcional de acertos! A coordenação motora fina do paciente associada ao rastreio visual rápido demonstrou resultados muito acima da média na última sessão.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
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
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
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
  
  chartWrapper: { 
    alignItems: 'center', 
    marginVertical: 16,
    marginLeft: -10, // Compensa o espaço do eixo Y pra centralizar melhor visualmente
  },
  
  aiCard: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginTop: 16 
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
  aiDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 }
});
