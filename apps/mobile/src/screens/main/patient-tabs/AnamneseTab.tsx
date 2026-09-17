import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, UIManager, LayoutAnimation, Pressable, ActivityIndicator, Modal } from 'react-native';
import { Save, ChevronDown, ChevronUp, User, Baby, Activity, TrendingUp, Moon, Heart, Shield, Users, Book, Pill, FileText, Stethoscope, CheckCircle2, Circle, CircleDashed, Trash2, AlertTriangle, XCircle } from 'lucide-react-native';
import { api } from '../../../services/api';
import { theme } from '../../../theme/theme';
import { useTranslation } from '../../../i18n';

const ThemeContext = createContext(theme.colors.primary);

// ------------------------------------------------------------------------------
// Componentes Auxiliares Declarados FORA da função principal (Evita remount e fechamento do teclado)
// ------------------------------------------------------------------------------

interface AccordionProps {
  id: string;
  title: string;
  icon: any;
  color?: string;
  fields?: string[];
  expandedSection: string | null;
  toggleSection: (section: string) => void;
  formData: any;
  children: React.ReactNode;
}

function Accordion({ id, title, icon: Icon, color = "#7B61FF", fields = [], expandedSection, toggleSection, formData, children }: AccordionProps) {
  const { t } = useTranslation();
  const isExpanded = expandedSection === id;

  const totalFields = fields.length;
  const filledCount = fields.filter((f: string) => {
    const val = formData[f];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== null && val !== '';
  }).length;
  
  const isComplete = totalFields > 0 && filledCount === totalFields;
  const isPartial = totalFields > 0 && filledCount > 0 && filledCount < totalFields;
  const isEmpty = totalFields > 0 && filledCount === 0;

  return (
    <ThemeContext.Provider value={color}>
      <View style={[styles.accordionContainer, { borderColor: `${color}30` }, isExpanded && { borderColor: color }]}>
        <View style={styles.cardBgIcon}>
          <Icon size={160} color={color} />
        </View>
        
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection(id)} activeOpacity={0.7}>
          <View style={styles.accordionTitleRow}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
              <Icon size={20} color={color} />
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.accordionTitle}>{title}</Text>
              
              {totalFields > 0 && (
                <View style={styles.progressRow}>
                  {isComplete && <CheckCircle2 key="complete" size={12} color={color} />}
                  {isPartial && <CircleDashed key="partial" size={12} color={`${color}90`} />}
                  {isEmpty && <Circle key="empty" size={12} color="rgba(255,255,255,0.3)" />}
                  
                  <Text style={[
                    styles.progressText,
                    isComplete && { color: color, fontWeight: 'bold' },
                    isPartial && { color: `${color}90` }
                  ]}>
                    {isComplete ? t.anamnese.completedBadge : t('anamnese.answeredCount', { filled: filledCount, total: totalFields })}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {isExpanded ? <ChevronUp size={20} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={20} color="rgba(255,255,255,0.5)" />}
        </TouchableOpacity>
        {isExpanded && <View style={styles.accordionContent}>{children}</View>}
      </View>
    </ThemeContext.Provider>
  );
}

const CustomTextInput = React.memo(function CustomTextInput({ style, field, value, onChangeField, ...props }: any) {
  const color = useContext(ThemeContext);
  return (
    <TextInput 
      style={[
        style, 
        { borderColor: `${color}40`, backgroundColor: 'rgba(0,0,0,0.2)' }
      ]} 
      placeholderTextColor="rgba(255,255,255,0.4)"
      value={value ?? ''}
      onChangeText={(text) => {
        if (onChangeField && field) {
          onChangeField(field, text);
        }
      }}
      {...props} 
    />
  );
});

function BooleanPill({ label, field, formData, setFormData }: { label: string, field: string, formData: any, setFormData: any }) {
  const { t } = useTranslation();
  const color = useContext(ThemeContext);
  const value = formData[field];
  return (
    <View style={styles.pillGroupContainer}>
      <Text style={styles.pillGroupLabel}>{label}</Text>
      <View style={styles.pillsRow}>
        <TouchableOpacity 
          style={[styles.pill, { borderColor: `${color}40` }, value === true && { backgroundColor: color, borderColor: color }]}
          onPress={() => setFormData((prev: any) => ({ ...prev, [field]: true }))}
        >
          <Text style={[styles.pillText, value === true && styles.pillTextActive]}>{t.common.yes}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pill, { borderColor: `${color}40` }, value === false && { backgroundColor: color, borderColor: color }]}
          onPress={() => setFormData((prev: any) => ({ ...prev, [field]: false }))}
        >
          <Text style={[styles.pillText, value === false && styles.pillTextActive]}>{t.common.no}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SelectPillGroup({ label, field, options, formData, setFormData }: { label: string, field: string, options: string[], formData: any, setFormData: any }) {
  const color = useContext(ThemeContext);
  const selected = formData[field] || '';
  return (
    <View style={styles.pillGroupContainer}>
      <Text style={styles.pillGroupLabel}>{label}</Text>
      <View style={styles.pillsRowWrap}>
        {options.map(opt => (
          <TouchableOpacity 
            key={opt}
            style={[styles.pillWrap, { borderColor: `${color}40` }, selected === opt && { backgroundColor: color, borderColor: color }]}
            onPress={() => setFormData((prev: any) => ({ ...prev, [field]: opt }))}
          >
            <Text style={[styles.pillText, selected === opt && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MultiSelectPillGroup({ label, field, options, formData, setFormData }: { label: string, field: string, options: string[], formData: any, setFormData: any }) {
  const color = useContext(ThemeContext);
  const selectedList: string[] = formData[field] || [];
  const toggle = (opt: string) => {
    if (selectedList.includes(opt)) {
      setFormData((prev: any) => ({ ...prev, [field]: selectedList.filter((i: string) => i !== opt) }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: [...selectedList, opt] }));
    }
  };
  return (
    <View style={styles.pillGroupContainer}>
      <Text style={styles.pillGroupLabel}>{label}</Text>
      <View style={styles.pillsRowWrap}>
        {options.map(opt => {
          const isActive = selectedList.includes(opt);
          return (
            <TouchableOpacity 
              key={opt}
              style={[styles.pillWrap, { borderColor: `${color}40` }, isActive && { backgroundColor: color, borderColor: color }]}
              onPress={() => toggle(opt)}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  );
}

interface AnamneseTabProps {
  patientId?: string;
  adminPsicologoId?: string;
}

export function AnamneseTab({ patientId, adminPsicologoId }: AnamneseTabProps) {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>('motivo');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Toast States
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);
  };

  const triggerErrorToast = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    setTimeout(() => {
      setShowErrorToast(false);
    }, 3500);
  };

  // Carregamento inicial da Anamnese
  useEffect(() => {
    if (!patientId) return;
    const fetchAnamnese = async () => {
      try {
        setLoading(true);
        const url = adminPsicologoId 
          ? `/api/patients/${patientId}/anamnese?psicologoId=${adminPsicologoId}`
          : `/api/patients/${patientId}/anamnese`;
        const response = await api.get(url);
        if (response.data?.success && response.data?.data?.content) {
          setFormData(response.data.data.content);
        } else {
          setFormData({});
        }
      } catch (err) {
        console.error("Erro ao carregar anamnese:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnamnese();
  }, [patientId, adminPsicologoId]);

  const handleSave = async () => {
    if (!patientId) {
      triggerErrorToast(t.anamnese.patientIdRequired);
      return;
    }
    try {
      setSaving(true);
      const url = adminPsicologoId 
        ? `/api/patients/${patientId}/anamnese?psicologoId=${adminPsicologoId}`
        : `/api/patients/${patientId}/anamnese`;
      
      const response = await api.put(url, {
        content: formData,
        status: Object.keys(formData).length > 0 ? 'completed' : 'draft'
      });

      if (response.data?.success) {
        triggerSuccessToast(t.anamnese.saveSuccess);
      }
    } catch (err: any) {
      console.error("Erro ao salvar anamnese:", err);
      triggerErrorToast(err.response?.data?.error || t.anamnese.saveError);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!patientId) return;
    try {
      setSaving(true);
      setShowDeleteModal(false);
      const url = adminPsicologoId 
        ? `/api/patients/${patientId}/anamnese?psicologoId=${adminPsicologoId}`
        : `/api/patients/${patientId}/anamnese`;
      await api.delete(url);
      
      // Reset completo de todos os campos da anamnese
      setFormData({});
      triggerSuccessToast(t.anamnese.deleteSuccess);
    } catch (err: any) {
      console.error("Erro ao excluir anamnese:", err);
      triggerErrorToast(err.response?.data?.error || t.anamnese.deleteError);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = React.useCallback((field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        
        <Accordion key="motivo" id="motivo" title={t.anamnese.motivoTitle} icon={FileText} color="#FFC857" fields={['queixa']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <Text style={styles.inputLabel}>{t.anamnese.queixaLabel}</Text>
          <CustomTextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder={t.anamnese.queixaPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.4)"
            field="queixa"
            value={formData.queixa || ''}
            onChangeField={handleFieldChange}
          />
        </Accordion>

        <Accordion key="gestacao" id="gestacao" title={t.anamnese.gestacaoTitle} icon={Baby} color="#EC4899" fields={['desejada', 'idadeMae', 'idadePai', 'prenatal', 'complGestacao', 'doencasGestacao']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <BooleanPill label={t.anamnese.desejadaLabel} field="desejada" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.inputField} field="idadeMae" placeholder={t.anamnese.idadeMaePlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.idadeMae} onChangeField={handleFieldChange} />
          <CustomTextInput style={styles.inputField} field="idadePai" placeholder={t.anamnese.idadePaiPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.idadePai} onChangeField={handleFieldChange} />
          <BooleanPill label={t.anamnese.prenatalLabel} field="prenatal" formData={formData} setFormData={setFormData} />
          
          <MultiSelectPillGroup 
            label={t.anamnese.complGestacaoLabel} 
            field="complGestacao" 
            options={t.anamnese.complGestacaoOptions} 
            formData={formData} 
            setFormData={setFormData} 
          />
          <CustomTextInput style={styles.textArea} multiline field="doencasGestacao" placeholder={t.anamnese.doencasGestacaoPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.doencasGestacao} onChangeField={handleFieldChange} />
        </Accordion>
        
        <Accordion key="parto" id="parto" title={t.anamnese.partoTitle} icon={Activity} color="#34D399" fields={['tipoParto', 'chorouAoNascer', 'uti', 'ictericia', 'pesoNascer', 'alturaNascer']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <SelectPillGroup label={t.anamnese.tipoPartoLabel} field="tipoParto" options={t.anamnese.tipoPartoOptions} formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.chorouLabel} field="chorouAoNascer" formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.utiLabel} field="uti" formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.ictericiaLabel} field="ictericia" formData={formData} setFormData={setFormData} />
          
          <Text style={styles.sectionSubtitle}>{t.anamnese.physicalMeasuresTitle}</Text>
          <View style={styles.pillGroupContainer}>
            <Text style={styles.pillGroupLabel}>{t.anamnese.pesoNascerLabel}</Text>
            <CustomTextInput 
              style={styles.inputField} 
              field="pesoNascer"
              placeholder={t.anamnese.pesoNascerPlaceholder} 
              placeholderTextColor="rgba(255,255,255,0.4)" 
              keyboardType="numeric" 
              value={formData.pesoNascer} 
              onChangeField={handleFieldChange} 
            />
          </View>

          <View style={styles.pillGroupContainer}>
            <Text style={styles.pillGroupLabel}>{t.anamnese.alturaNascerLabel}</Text>
            <CustomTextInput 
              style={styles.inputField} 
              field="alturaNascer"
              placeholder={t.anamnese.alturaNascerPlaceholder} 
              placeholderTextColor="rgba(255,255,255,0.4)" 
              keyboardType="numeric" 
              value={formData.alturaNascer} 
              onChangeField={handleFieldChange} 
            />
          </View>
        </Accordion>

        <Accordion key="desenvolvimento" id="desenvolvimento" title={t.anamnese.desenvolvimentoTitle} icon={TrendingUp} color="#60A5FA" fields={['sentar', 'andar', 'primeirasPalavras', 'desfralde', 'tiques']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <Text style={styles.sectionSubtitle}>{t.anamnese.idadeMesesHeader}</Text>
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} field="sentar" placeholder={t.anamnese.sentarPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.sentar} onChangeField={handleFieldChange} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} field="andar" placeholder={t.anamnese.andarPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.andar} onChangeField={handleFieldChange} />
          </View>
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} field="primeirasPalavras" placeholder={t.anamnese.primeirasPalavrasPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.primeirasPalavras} onChangeField={handleFieldChange} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} field="desfralde" placeholder={t.anamnese.desfraldePlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.desfralde} onChangeField={handleFieldChange} />
          </View>

          <BooleanPill label={t.anamnese.tiquesLabel} field="tiques" formData={formData} setFormData={setFormData} />
        </Accordion>

        <Accordion key="sonoAlimentacao" id="sonoAlimentacao" title={t.anamnese.sonoAlimentacaoTitle} icon={Moon} color="#A855F7" fields={['alimentacaoInfancia', 'alimentacaoAtual', 'sonoTranquilo', 'horasSono', 'dormeSozinho', 'disturbiosSono']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <SelectPillGroup label={t.anamnese.alimentacaoInfanciaLabel} field="alimentacaoInfancia" options={t.anamnese.alimentacaoInfanciaOptions} formData={formData} setFormData={setFormData} />
          <SelectPillGroup label={t.anamnese.alimentacaoAtualLabel} field="alimentacaoAtual" options={t.anamnese.alimentacaoAtualOptions} formData={formData} setFormData={setFormData} />
          
          <BooleanPill label={t.anamnese.sonoTranquiloLabel} field="sonoTranquilo" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.inputField} field="horasSono" placeholder={t.anamnese.horasSonoPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.horasSono} onChangeField={handleFieldChange} />
          <BooleanPill label={t.anamnese.dormeSozinhoLabel} field="dormeSozinho" formData={formData} setFormData={setFormData} />
          
          <MultiSelectPillGroup 
            label={t.anamnese.disturbiosSonoLabel} 
            field="disturbiosSono" 
            options={t.anamnese.disturbiosSonoOptions} 
            formData={formData} 
            setFormData={setFormData} 
          />
        </Accordion>

        <Accordion key="sexualidade" id="sexualidade" title={t.anamnese.sexualidadeTitle} icon={Heart} color="#F43F5E" fields={['curiosidadeSexual', 'manipulacao', 'orientacaoSexual', 'relatosSex']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <BooleanPill label={t.anamnese.curiosidadeSexualLabel} field="curiosidadeSexual" formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.manipulacaoLabel} field="manipulacao" formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.orientacaoSexualLabel} field="orientacaoSexual" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.textArea} multiline field="relatosSex" placeholder={t.anamnese.relatosSexPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.relatosSex} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion key="historiaMedica" id="historiaMedica" title={t.anamnese.historiaMedicaTitle} icon={Shield} color="#3B82F6" fields={['doencasAnteriores', 'traumatismo', 'enxaqueca', 'convulsao', 'detalhesMedicos']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <MultiSelectPillGroup 
            label={t.anamnese.doencasAnterioresLabel} 
            field="doencasAnteriores" 
            options={t.anamnese.doencasAnterioresOptions} 
            formData={formData} 
            setFormData={setFormData} 
          />
          <BooleanPill label={t.anamnese.traumatismoLabel} field="traumatismo" formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.enxaquecaLabel} field="enxaqueca" formData={formData} setFormData={setFormData} />
          <BooleanPill label={t.anamnese.convulsaoLabel} field="convulsao" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.textArea} multiline field="detalhesMedicos" placeholder={t.anamnese.detalhesMedicosPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.detalhesMedicos} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion key="ambienteFamiliar" id="ambienteFamiliar" title={t.anamnese.ambienteFamiliarTitle} icon={Users} color="#10B981" fields={['situacaoPais', 'relacionamentos', 'interacaoSocial']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <SelectPillGroup label={t.anamnese.situacaoPaisLabel} field="situacaoPais" options={t.anamnese.situacaoPaisOptions} formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.textArea} multiline field="relacionamentos" placeholder={t.anamnese.relacionamentosPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.relacionamentos} onChangeField={handleFieldChange} />
          
          <MultiSelectPillGroup 
            label={t.anamnese.interacaoSocialLabel} 
            field="interacaoSocial" 
            options={t.anamnese.interacaoSocialOptions} 
            formData={formData} 
            setFormData={setFormData} 
          />
        </Accordion>

        <Accordion key="escolaridade" id="escolaridade" title={t.anamnese.escolaridadeTitle} icon={Book} color="#F59E0B" fields={['gostaEscola', 'dificuldadeEscolar', 'historicoEscolar']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <BooleanPill label={t.anamnese.gostaEscolaLabel} field="gostaEscola" formData={formData} setFormData={setFormData} />
          <MultiSelectPillGroup 
            label={t.anamnese.dificuldadeEscolarLabel} 
            field="dificuldadeEscolar" 
            options={t.anamnese.dificuldadeEscolarOptions} 
            formData={formData} 
            setFormData={setFormData} 
          />
          <CustomTextInput style={styles.textArea} multiline field="historicoEscolar" placeholder={t.anamnese.historicoEscolarPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.historicoEscolar} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion key="tratamentos" id="tratamentos" title={t.anamnese.tratamentosTitle} icon={Pill} color="#EF4444" fields={['tratamentos', 'usoMedicacao', 'medicacoes']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <CustomTextInput style={styles.textArea} multiline field="tratamentos" placeholder={t.anamnese.tratamentosPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.tratamentos} onChangeField={handleFieldChange} />
          
          <BooleanPill label={t.anamnese.usoMedicacaoLabel} field="usoMedicacao" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.inputField} field="medicacoes" placeholder={t.anamnese.medicacoesPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.medicacoes} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion key="observacoesFinais" id="observacoesFinais" title={t.anamnese.observacoesFinaisTitle} icon={Stethoscope} color="#8B5CF6" fields={['impressaoGeral', 'planoIntervencao']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <CustomTextInput style={styles.textArea} multiline field="impressaoGeral" placeholder={t.anamnese.impressaoGeralPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.impressaoGeral} onChangeField={handleFieldChange} />
          <CustomTextInput style={styles.textArea} multiline field="planoIntervencao" placeholder={t.anamnese.planoIntervencaoPlaceholder} placeholderTextColor="rgba(255,255,255,0.4)" value={formData.planoIntervencao} onChangeField={handleFieldChange} />
        </Accordion>

        {/* Seção Fixa de Exclusão */}
        {Object.keys(formData).length > 0 && (
          <View style={styles.dangerCardFixed}>
            <View style={styles.cardBgIcon}>
              <Trash2 size={160} color="#EF4444" />
            </View>

            <View style={styles.dangerCardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
                <Trash2 size={20} color="#EF4444" />
              </View>

              <View style={styles.titleColumn}>
                <Text style={styles.dangerCardTitle}>{t.anamnese.deleteTitle}</Text>
                <Text style={styles.dangerCardSubtitle}>{t.anamnese.dangerZone}</Text>
              </View>
            </View>

            <View style={styles.dangerCardContent}>
              <Text style={styles.dangerZoneText}>
                {t.anamnese.dangerZoneWarning}
              </Text>

              <TouchableOpacity 
                style={styles.dangerCardButton} 
                onPress={() => setShowDeleteModal(true)}
                disabled={saving}
              >
                <Trash2 size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.dangerCardButtonText}>{t.anamnese.deleteResetBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal de Confirmação de Exclusão da Anamnese */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerRed}>
            <View style={styles.modalIconBgRed}>
              <Trash2 color="#FF4B4B" size={32} />
            </View>
            <Text style={styles.modalTitleRed}>{t.anamnese.deleteConfirmTitle}</Text>
            <Text style={styles.modalMessage}>
              {t.anamnese.deleteConfirmModalMessage}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButtonRed}
                onPress={confirmDelete}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmTextRed}>{t.anamnese.confirmDeleteBtn}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.saveFab, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
          ) : (
            <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.saveText}>{saving ? t.anamnese.savingText : t.anamnese.saveBtn}</Text>
        </TouchableOpacity>
      </View>

      {/* Popup Toast de Sucesso Teko Style */}
      {showSuccessToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{t.common.success}</Text>
            <Text style={styles.toastMessage}>{successMessage}</Text>
          </View>
        </View>
      )}

      {/* Popup Toast de Erro Teko Style */}
      {showErrorToast && (
        <View style={styles.errorToastContainer}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#DC2626" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>{t.common.error}</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 16, paddingBottom: 90 },
  
  accordionContainer: { 
    backgroundColor: theme.colors.cardBg, 
    borderRadius: theme.radii.lg, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.subtle,
  },
  cardBgIcon: {
    position: 'absolute',
    top: -20,
    right: -20,
    opacity: 0.12,
    pointerEvents: 'none',
  },
  accordionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 14,
    zIndex: 1
  },
  accordionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  iconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: theme.radii.md, 
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 10 
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  accordionTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: theme.colors.textDark,
    flexShrink: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  accordionContent: { 
    padding: 14, 
    paddingTop: 0,
    zIndex: 1
  },
  
  inputLabel: {
    color: theme.colors.textDark,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  inputField: { 
    borderRadius: theme.radii.md, 
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: '#FFFFFF',
    color: theme.colors.textDark, 
    fontSize: 14, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  textArea: { 
    borderRadius: theme.radii.md, 
    padding: 14, 
    backgroundColor: '#FFFFFF',
    color: theme.colors.textDark, 
    fontSize: 14, 
    minHeight: 110, 
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  pillGroupContainer: {
    marginBottom: 14,
  },
  pillGroupLabel: {
    color: theme.colors.textDark,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: theme.colors.tealSoft,
    borderColor: theme.colors.tealMint,
    borderWidth: 1,
    height: 40,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillWrap: {
    backgroundColor: theme.colors.tealSoft,
    borderColor: theme.colors.tealMint,
    borderWidth: 1,
    height: 38,
    borderRadius: theme.radii.full,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Card Fixo de Exclusão (Sempre Aberto) */
  dangerCardFixed: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.subtle,
  },
  dangerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    zIndex: 1,
  },
  dangerCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.accentOrange,
  },
  dangerCardSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  dangerCardContent: {
    padding: 14,
    paddingTop: 0,
    zIndex: 1,
  },
  dangerZoneText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  dangerCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentOrange,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
  },
  dangerCardButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Modal Estilo Teko */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerRed: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    ...theme.shadows.floating,
  },
  modalIconBgRed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
  },
  modalTitleRed: {
    color: theme.colors.accentOrange,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalMessage: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  modalConfirmButtonRed: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextRed: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  fabContainer: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    zIndex: 10,
  },
  saveFab: { 
    flexDirection: 'row', 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: theme.radii.full, 
    alignItems: 'center', 
    ...theme.shadows.floating,
  },
  saveText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 15 
  },

  /* Teko Toast Banners */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -105 : -110,
    right: 0,
    left: 0,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 99999,
  },
  toastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: theme.colors.primary, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    color: theme.colors.textDark,
    fontSize: 13,
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -105 : -110,
    right: 0,
    left: 0,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: '#DC2626',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 99999,
  },
  errorToastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  errorToastTitle: {
    color: '#DC2626', 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  }
});
