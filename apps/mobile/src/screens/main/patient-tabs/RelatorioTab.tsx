import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Alert,
  Image
} from 'react-native';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Calendar, 
  BookOpen, 
  Gamepad2, 
  Clock, 
  Sparkles,
  FileDown,
  XCircle,
  ShieldCheck
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api, API_URL } from '../../../services/api';
import { theme } from '../../../theme/theme';
import { useTranslation } from '../../../i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';

const relatorioImg = require('../../../../assets/elementos_visuais/relatorio.png');

interface RelatorioTabProps {
  patientId?: string;
  adminPsicologoId?: string;
}

export function RelatorioTab({ patientId, adminPsicologoId }: RelatorioTabProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [statusData, setStatusData] = useState<any>(null);

  // Modal de geração de PDF no mesmo padrão estético da Anamnese
  const [pdfModalVisible, setPdfModalVisible] = useState<boolean>(false);
  const [pdfStep, setPdfStep] = useState<'generating' | 'ready' | 'error'>('generating');
  const [pdfProgressText, setPdfProgressText] = useState<string>(t.relatorio.modalGeneratingSub);
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string>('');

  const fetchStatus = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const url = adminPsicologoId 
        ? `/api/patients/${patientId}/report-status?psicologoId=${adminPsicologoId}`
        : `/api/patients/${patientId}/report-status`;
      
      const res = await api.get(url);
      if (res.data) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.warn("[RelatorioTab] Erro ao buscar status:", err);
      // Fallback gracioso para visualização
      setStatusData({
        unlocked: false,
        hasAnamnese: true,
        hasCompletedBattery: false,
        batteryCount: 0,
        notesCount: 0,
        lastBattery: {
          vtr: 0,
          vtri: 0,
          qa: 0,
          imp: 0,
          hasPlayedGoleiro: false,
          hasPlayedToca: false,
          hasPlayedFotografo: false,
          idade: 8.0,
          completedAt: "Não jogado"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [patientId, adminPsicologoId]);

  const handleGeneratePdf = async () => {
    if (!patientId) {
      Alert.alert(t.common.error, t.relatorio.selectPatientError);
      return;
    }

    try {
      setPdfStep('generating');
      setPdfProgressText(t.relatorio.modalGeneratingSub);
      setPdfErrorMessage('');
      setPdfModalVisible(true);

      const currentLang = language || 'pt';

      // 1. Inicia o Job de geração em segundo plano no servidor (resposta instantânea < 100ms)
      const startUrl = adminPsicologoId 
        ? `/api/patients/${patientId}/relatorio-pdf?psicologoId=${adminPsicologoId}&lang=${currentLang}&action=start`
        : `/api/patients/${patientId}/relatorio-pdf?lang=${currentLang}&action=start`;

      await api.post(startUrl);

      // 2. Loop de Polling de Status (requisições curtas de ~50ms a cada 3 segundos, imune a socket timeout)
      const statusUrl = adminPsicologoId
        ? `/api/patients/${patientId}/relatorio-pdf?psicologoId=${adminPsicologoId}&lang=${currentLang}&action=status`
        : `/api/patients/${patientId}/relatorio-pdf?lang=${currentLang}&action=status`;

      let attempts = 0;
      // Tolerância praticamente ilimitada (1000 * 3s = 3000s / 50 minutos) para garantir que documentos complexos e densos nunca dêem timeout
      const maxAttempts = 1000;

      const pollInterval = setInterval(async () => {
        attempts++;

        // Atualização dinâmica do status visual no modal para transmitir processamento ativo contínuo
        if (attempts === 2) {
          setPdfProgressText(t.relatorio.modalAiProgressText);
        } else if (attempts === 15) {
          setPdfProgressText(t.relatorio.modalPdfCompileProgressText);
        } else if (attempts === 40) {
          setPdfProgressText(language === 'en' ? 'Refining charts, neurofunctional indicators, and document layout...' : 'Refinando gráficos, indicadores neurofuncionais e diagramação...');
        } else if (attempts === 80) {
          setPdfProgressText(language === 'en' ? 'Finalizing high-resolution biometric pages and clinical traceability...' : 'Finalizando páginas de alta resolução e rastreabilidade clínica...');
        } else if (attempts % 40 === 0) {
          setPdfProgressText(language === 'en' ? 'Processing report sections with maximum accuracy...' : 'Processando seções do laudo com máxima precisão...');
        }

        try {
          const res = await api.get(statusUrl);
          const { status, error } = res.data || {};

          if (status === 'ready') {
            clearInterval(pollInterval);
            
            // 3. Com o PDF pronto e renderizado no disco do servidor, faz o download do arquivo preparado
            const pdfEndpoint = adminPsicologoId 
              ? `${API_URL}/api/patients/${patientId}/relatorio-pdf?psicologoId=${adminPsicologoId}&lang=${currentLang}&action=download`
              : `${API_URL}/api/patients/${patientId}/relatorio-pdf?lang=${currentLang}&action=download`;

            let authHeader = api.defaults.headers.common['Authorization'];
            if (!authHeader) {
              const storedToken = await AsyncStorage.getItem('userToken');
              if (storedToken) authHeader = `Bearer ${storedToken}`;
            }

            const localFileUri = `${FileSystem.documentDirectory}Relatorio_Final_${patientId.substring(0, 6)}.pdf`;

            const downloadResult = await FileSystem.downloadAsync(
              pdfEndpoint,
              localFileUri,
              {
                headers: authHeader ? { Authorization: String(authHeader) } : {},
              }
            );

            if (downloadResult.status === 200) {
              setGeneratedPdfUri(downloadResult.uri);
              setPdfStep('ready');
            } else {
              setPdfErrorMessage(`Status HTTP ${downloadResult.status}`);
              setPdfStep('error');
            }
          } else if (status === 'error') {
            clearInterval(pollInterval);
            setPdfErrorMessage(error || t.relatorio.modalErrorSub);
            setPdfStep('error');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPdfErrorMessage(language === 'en' ? 'The generation process took longer than expected. Please try again.' : 'O processo de geração levou mais tempo que o esperado. Tente novamente.');
            setPdfStep('error');
          }
        } catch (pollErr: any) {
          console.warn("[RelatorioTab] Erro no polling de status:", pollErr);
        }
      }, 3000);

    } catch (err: any) {
      console.error("[RelatorioTab] Erro ao iniciar PDF:", err);
      const msg = err.response?.data?.error || err.message || t.relatorio.generationErrorConnection;
      setPdfErrorMessage(msg);
      setPdfStep('error');
    }
  };

  const handleOpenSharedPdf = async () => {
    if (!generatedPdfUri) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(generatedPdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: t.relatorio.downloadPdfBtn,
          UTI: 'com.adobe.pdf',
        });
      }
      setPdfModalVisible(false);
    } catch (err) {
      console.error("Erro ao abrir compartilhamento do PDF:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t.relatorio.loadingText}</Text>
      </View>
    );
  }

  const isUnlocked = statusData?.unlocked ?? false;
  const hasAnamnese = statusData?.hasAnamnese ?? false;
  const hasCompletedBattery = statusData?.hasCompletedBattery ?? false;
  const batteryCount = statusData?.batteryCount ?? 0;
  const notesCount = statusData?.notesCount ?? 0;
  const lastBattery = statusData?.lastBattery || { vtr: 0, vtri: 0, qa: 0, imp: 0, idade: 8.0 };

  const hasPlayedGoleiro = statusData?.lastBattery?.hasPlayedGoleiro ?? Boolean(lastBattery?.vtri && lastBattery.vtri > 0);
  const hasPlayedToca = statusData?.lastBattery?.hasPlayedToca ?? Boolean(lastBattery?.imp !== undefined && lastBattery.imp >= 0 && hasCompletedBattery);
  const hasPlayedFotografo = statusData?.lastBattery?.hasPlayedFotografo ?? Boolean(lastBattery?.qa && lastBattery.qa > 0);

  const bottomPadding = Math.max(insets.bottom + 110, 130);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Refinado com Ilustração relatorio.png e Explicação Dinamizada */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerBadgeRow}>
            <View style={[styles.statusTag, isUnlocked ? styles.statusTagSuccess : styles.statusTagPending]}>
              {isUnlocked ? (
                <CheckCircle2 size={13} color="#059669" />
              ) : (
                <Clock size={13} color="#D97706" />
              )}
              <Text style={[styles.statusTagText, isUnlocked ? styles.statusTagTextSuccess : styles.statusTagTextPending]}>
                {isUnlocked ? t.relatorio.unlockedStatus : t.relatorio.pendingStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>{t.relatorio.bannerTitle}</Text>
          
          <Text style={styles.bannerDesc}>
            {t.relatorio.bannerDesc}
          </Text>

          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStatItem}>
              <Sparkles size={13} color={theme.colors.primary} />
              <Text style={styles.bannerStatText}>{t.relatorio.aiSynthesis}</Text>
            </View>
            <View style={styles.bannerStatDivider} />
            <View style={styles.bannerStatItem}>
              <ShieldCheck size={13} color="#059669" />
              <Text style={styles.bannerStatText}>{t.relatorio.adhdModel}</Text>
            </View>
          </View>
        </View>

        <Image 
          source={relatorioImg} 
          style={styles.bannerImage} 
          resizeMode="contain" 
        />
      </View>

      {/* Título da Seção */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t.relatorio.requirementsSectionTitle}</Text>
        <Text style={styles.sectionSub}>{t.relatorio.requirementsSectionSub}</Text>
      </View>

      {/* Grid Harmonioso de Requisitos e Fontes de Dados (Anamnese, Jogos, Notas) */}
      <View style={styles.gridContainer}>
        {/* Card 1: Anamnese */}
        <View style={[styles.gridCard, hasAnamnese ? styles.cardSuccessBorder : styles.cardPendingBorder]}>
          <View style={styles.gridCardHeader}>
            <View style={[styles.gridIconBg, { backgroundColor: '#E2F0EC' }]}>
              <BookOpen color="#0D766E" size={18} />
            </View>
            {hasAnamnese ? (
              <View style={styles.statusBadgeConfirmed}>
                <CheckCircle2 size={12} color="#059669" />
                <Text style={styles.statusBadgeConfirmedText}>{t.relatorio.statusOk}</Text>
              </View>
            ) : (
              <View style={styles.statusBadgePending}>
                <Clock size={12} color="#D97706" />
                <Text style={styles.statusBadgePendingText}>{t.relatorio.statusPending}</Text>
              </View>
            )}
          </View>
          <Text style={styles.gridCardTitle}>{t.relatorio.anamneseTitle}</Text>
          <Text style={styles.gridCardSub}>
            {hasAnamnese ? t.relatorio.anamneseFilled : t.relatorio.anamnesePending}
          </Text>
        </View>

        {/* Card 2: Sessões de Jogos (Bateria Completa - 3 Jogos Obrigatoriamente) */}
        <View style={[styles.gridCard, hasCompletedBattery ? styles.cardSuccessBorder : styles.cardPendingBorder]}>
          <View style={styles.gridCardHeader}>
            <View style={[styles.gridIconBg, { backgroundColor: '#ECFDF5' }]}>
              <Gamepad2 color="#059669" size={18} />
            </View>
            {hasCompletedBattery ? (
              <View style={styles.statusBadgeConfirmed}>
                <CheckCircle2 size={12} color="#059669" />
                <Text style={styles.statusBadgeConfirmedText}>{t.relatorio.statusOk}</Text>
              </View>
            ) : (
              <View style={styles.statusBadgePending}>
                <Clock size={12} color="#D97706" />
                <Text style={styles.statusBadgePendingText}>{t.relatorio.statusPending}</Text>
              </View>
            )}
          </View>
          <Text style={styles.gridCardTitle}>{t('relatorio.gamesTitle', { count: batteryCount })}</Text>
          <Text style={styles.gridCardSub}>
            {hasCompletedBattery 
              ? t('relatorio.gamesCount', { count: batteryCount }) 
              : `${(hasPlayedGoleiro ? 1 : 0) + (hasPlayedToca ? 1 : 0) + (hasPlayedFotografo ? 1 : 0)}/3 jogos realizados`}
          </Text>
        </View>

        {/* Card 3: Notas do Psicólogo (Largura Completa 100%) */}
        <View style={[styles.gridCard, styles.fullWidthGridCard, notesCount > 0 ? styles.cardSuccessBorder : styles.cardInfoBorder]}>
          <View style={styles.gridCardHeader}>
            <View style={[styles.gridIconBg, { backgroundColor: '#F3EEFF' }]}>
              <FileText color="#7C3AED" size={18} />
            </View>
            <View style={notesCount > 0 ? styles.statusBadgeConfirmed : styles.statusBadgeInfo}>
              {notesCount > 0 ? (
                <CheckCircle2 size={12} color="#059669" />
              ) : (
                <Clock size={12} color="#6B7280" />
              )}
              <Text style={notesCount > 0 ? styles.statusBadgeConfirmedText : styles.statusBadgeInfoText}>
                {notesCount > 0 ? t('relatorio.notesCountBadge', { count: notesCount }) : t.relatorio.notesNoneBadge}
              </Text>
            </View>
          </View>
          <Text style={styles.gridCardTitle}>{t('relatorio.notesTitle', { count: notesCount })}</Text>
          <Text style={styles.gridCardSub}>{t.relatorio.notesSub}</Text>
        </View>
      </View>

      {/* Seção de Telemetria e Indicadores dos Jogos */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t.relatorio.telemetrySectionTitle}</Text>
        <Text style={styles.sectionSub}>{t.relatorio.telemetrySectionSub}</Text>
      </View>

      {/* Grid 2x2 de Indicadores dos Jogos */}
      <View style={styles.gridContainer}>
        {/* Oscilação no Foco (VTRI - Goleiro) */}
        <View style={styles.biomarkerCard}>
          <Text style={styles.biomarkerLabel}>{t.relatorio.focusOscillation}</Text>
          <Text style={styles.biomarkerValue}>
            {hasPlayedGoleiro ? `${lastBattery?.vtri || 0} ms` : '0 ms'}
          </Text>
          <Text style={styles.biomarkerHint}>
            {hasPlayedGoleiro ? t.relatorio.focusOscillationHint : (t.relatorio.notPlayed || 'Não jogado')}
          </Text>
        </View>

        {/* Erros de Impulsividade (IMP - Toca Rápido) */}
        <View style={styles.biomarkerCard}>
          <Text style={styles.biomarkerLabel}>{t.relatorio.impulsivityErrors}</Text>
          <Text style={styles.biomarkerValue}>
            {hasPlayedToca ? Math.round(lastBattery?.imp ?? 0) : 0}
          </Text>
          <Text style={styles.biomarkerHint}>
            {hasPlayedToca ? t.relatorio.impulsivityErrorsHint : (t.relatorio.notPlayed || 'Não jogado')}
          </Text>
        </View>

        {/* Queda de Atenção (QA - Fotógrafo da Floresta) */}
        <View style={styles.biomarkerCard}>
          <Text style={styles.biomarkerLabel}>{t.relatorio.attentionDecline}</Text>
          <Text style={styles.biomarkerValue}>
            {hasPlayedFotografo ? (lastBattery?.qa ?? 0) : 0}
          </Text>
          <Text style={styles.biomarkerHint}>
            {hasPlayedFotografo ? t.relatorio.attentionDeclineHint : (t.relatorio.notPlayed || 'Não jogado')}
          </Text>
        </View>

        {/* Idade do Paciente */}
        <View style={styles.biomarkerCard}>
          <Text style={styles.biomarkerLabel}>{t.relatorio.patientAge}</Text>
          <Text style={styles.biomarkerValue}>
            {t('common.years', { count: Math.round(lastBattery?.idade || 8.0) })}
          </Text>
          <Text style={styles.biomarkerHint}>{t.relatorio.patientAgeHint}</Text>
        </View>
      </View>

      {/* Botão de Ação Principal: Gerar PDF */}
      <TouchableOpacity 
        style={[styles.actionBtn, !isUnlocked && styles.actionBtnDisabled]}
        onPress={handleGeneratePdf}
        disabled={!isUnlocked}
        activeOpacity={0.85}
      >
        <View style={styles.btnRow}>
          <FileDown color="#FFFFFF" size={22} />
          <Text style={styles.actionBtnText}>{t.relatorio.generatePdfBtn}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.timeHintText}>
        {(t.relatorio as any).timeEstimateHint || '⚡ A síntese neuropsicológica por IA pode levar até 3 minutos para ser gerada.'}
      </Text>

      {/* Modal Tela Geral de Fabricação do PDF Teko */}
      <Modal
        visible={pdfModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (pdfStep !== 'generating') setPdfModalVisible(false);
        }}
      >
        <View style={styles.modalOverlayLock}>
          <View style={styles.tekoPdfModalContainer}>
            {pdfStep === 'generating' && (
              <>
                <View style={styles.tekoModalIconBgEmerald}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
                <Text style={styles.tekoPdfModalTitle}>{t.relatorio.modalGeneratingTitle}</Text>
                <Text style={styles.tekoPdfModalSubtitle}>
                  {pdfProgressText}
                </Text>

                <View style={styles.timeNoticeBox}>
                  <Clock size={15} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.timeNoticeText}>
                    {(t.relatorio as any).generationWarningNotice || 'A síntese qualitativa por IA é detalhada e pode levar até 3 minutos. Por favor, aguarde.'}
                  </Text>
                </View>

                <View style={styles.loadingBarContainer}>
                  <View style={styles.loadingBarPulse} />
                </View>
              </>
            )}

            {pdfStep === 'ready' && (
              <>
                <View style={styles.tekoModalIconBgMint}>
                  <CheckCircle2 color={theme.colors.primary} size={36} />
                </View>
                <Text style={styles.tekoPdfModalTitle}>{t.relatorio.modalReadyTitle}</Text>
                <Text style={styles.tekoPdfModalSubtitle}>
                  {t.relatorio.modalReadySub}
                </Text>
                
                <TouchableOpacity 
                  style={styles.downloadPdfButton} 
                  onPress={handleOpenSharedPdf}
                  activeOpacity={0.8}
                >
                  <FileDown size={22} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.downloadPdfButtonText}>{t.relatorio.downloadPdfBtn}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.closePdfModalButton} 
                  onPress={() => setPdfModalVisible(false)}
                >
                  <Text style={styles.closePdfModalButtonText}>{t.relatorio.closeModalBtn}</Text>
                </TouchableOpacity>
              </>
            )}

            {pdfStep === 'error' && (
              <>
                <View style={styles.modalIconBgRed}>
                  <XCircle color="#FF4B4B" size={36} />
                </View>
                <Text style={styles.modalTitleRed}>{t.relatorio.modalErrorTitle}</Text>
                <Text style={styles.tekoPdfModalSubtitle}>
                  {pdfErrorMessage || t.relatorio.modalErrorSub}
                </Text>
                
                <TouchableOpacity 
                  style={styles.modalCancelButton} 
                  onPress={() => setPdfModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>{t.relatorio.closeModalBtn}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },

  /* Banner Ilustrado Refinado */
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...theme.shadows.subtle,
  },
  bannerContent: {
    flex: 1,
    marginRight: 10,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    gap: 4,
  },
  statusTagSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusTagPending: {
    backgroundColor: '#FFF7D9',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTagTextSuccess: {
    color: '#059669',
  },
  statusTagTextPending: {
    color: '#D97706',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
    marginBottom: 10,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerStatText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  bannerStatDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
  },
  bannerImage: {
    width: 82,
    height: 92,
  },

  /* Cabeçalho de Seção */
  sectionHeaderRow: {
    marginBottom: 14,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  sectionSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  /* Grid 2 colunas */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  gridCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.subtle,
  },
  fullWidthGridCard: {
    width: '100%',
  },
  cardSuccessBorder: {
    borderColor: '#E2E8F0',
  },
  cardPendingBorder: {
    borderColor: '#E2E8F0',
  },
  cardInfoBorder: {
    borderColor: '#E2E8F0',
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridIconBg: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  gridCardSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 3,
  },

  /* Badges nos Cards do Grid */
  statusBadgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    gap: 4,
  },
  statusBadgeConfirmedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  statusBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7D9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    gap: 4,
  },
  statusBadgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statusBadgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    gap: 4,
  },
  statusBadgeInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  /* Cards de Biomarcadores Telemétricos */
  biomarkerCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.subtle,
  },
  biomarkerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  biomarkerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  biomarkerHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 3,
  },

  /* Botão de Ação Principal */
  actionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    ...theme.shadows.card,
  },
  actionBtnDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Modal de Geração de PDF Padrão Teko Anamnese */
  modalOverlayLock: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tekoPdfModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.floating,
  },
  tekoModalIconBgEmerald: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tekoModalIconBgMint: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBgRed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tekoPdfModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalTitleRed: {
    fontSize: 19,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  tekoPdfModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  loadingBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  loadingBarPulse: {
    width: '60%',
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  downloadPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 10,
    ...theme.shadows.card,
  },
  downloadPdfButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closePdfModalButton: {
    paddingVertical: 10,
  },
  closePdfModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: theme.radii.md,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  timeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: theme.radii.sm,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  timeNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 17,
    fontWeight: '500',
  },
  timeHintText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});
