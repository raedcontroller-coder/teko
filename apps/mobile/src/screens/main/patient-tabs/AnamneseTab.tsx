import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, UIManager, LayoutAnimation, Pressable, ActivityIndicator, Alert, Modal } from 'react-native';
import { Save, ChevronDown, ChevronUp, User, Baby, Activity, TrendingUp, Moon, Heart, Shield, Users, Book, Pill, FileText, Stethoscope, CheckCircle2, Circle, CircleDashed, Trash2, AlertTriangle } from 'lucide-react-native';
import { api } from '../../../services/api';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ThemeContext = createContext('#7B61FF');

interface AnamneseTabProps {
  patientId?: string;
  adminPsicologoId?: string;
}

export function AnamneseTab({ patientId, adminPsicologoId }: AnamneseTabProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('Motivo da Consulta');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

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
      Alert.alert("Aviso", "Identificador do paciente não informado.");
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
        Alert.alert("Sucesso", "Anamnese salva com sucesso no banco!");
      }
    } catch (err: any) {
      console.error("Erro ao salvar anamnese:", err);
      Alert.alert("Erro", err.response?.data?.error || "Falha ao salvar anamnese no servidor.");
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
    } catch (err: any) {
      console.error("Erro ao excluir anamnese:", err);
      Alert.alert("Erro", err.response?.data?.error || "Falha ao excluir anamnese.");
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

// ------------------------------------------------------------------------------
// Componentes Auxiliares Declarados no Top-Level (Evita remount e fechamento do teclado)
// ------------------------------------------------------------------------------

interface AccordionProps {
  title: string;
  icon: any;
  color?: string;
  fields?: string[];
  expandedSection: string | null;
  toggleSection: (section: string) => void;
  formData: any;
  children: React.ReactNode;
}

function Accordion({ title, icon: Icon, color = "#7B61FF", fields = [], expandedSection, toggleSection, formData, children }: AccordionProps) {
  const isExpanded = expandedSection === title;

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
        <View style={[styles.cardBgIcon, { opacity: 0.15 }]}>
          <Icon size={160} color={color} />
        </View>
        
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection(title)} activeOpacity={0.7}>
          <View style={styles.accordionTitleRow}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
              <Icon size={20} color={color} />
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.accordionTitle}>{title}</Text>
              
              {totalFields > 0 && (
                <View style={styles.progressRow}>
                  {isComplete && <CheckCircle2 size={12} color={color} />}
                  {isPartial && <CircleDashed size={12} color={`${color}90`} />}
                  {isEmpty && <Circle size={12} color="rgba(255,255,255,0.3)" />}
                  
                  <Text style={[
                    styles.progressText,
                    isComplete && { color: color, fontWeight: 'bold' },
                    isPartial && { color: `${color}90` }
                  ]}>
                    {isComplete ? 'Concluído' : `${filledCount}/${totalFields} respondidos`}
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

function CustomTextInput({ style, field, value, onChangeField, ...props }: any) {
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
}

function BooleanPill({ label, field, formData, setFormData }: { label: string, field: string, formData: any, setFormData: any }) {
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
          <Text style={[styles.pillText, value === true && styles.pillTextActive]}>Sim</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pill, { borderColor: `${color}40` }, value === false && { backgroundColor: color, borderColor: color }]}
          onPress={() => setFormData((prev: any) => ({ ...prev, [field]: false }))}
        >
          <Text style={[styles.pillText, value === false && styles.pillTextActive]}>Não</Text>
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

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        
        <Accordion title="Motivo da Consulta" icon={FileText} color="#FFC857" fields={['queixa']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <Text style={styles.inputLabel}>Queixa Principal</Text>
          <CustomTextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Descreva detalhadamente a queixa que motivou a consulta..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            field="queixa"
            value={formData.queixa || ''}
            onChangeField={handleFieldChange}
          />
        </Accordion>

        <Accordion title="Gestação e Concepção" icon={Baby} color="#EC4899" fields={['desejada', 'idadeMae', 'idadePai', 'prenatal', 'complGestacao', 'doencasGestacao']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <BooleanPill label="Criança planejada/desejada?" field="desejada" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.inputField} field="idadeMae" placeholder="Idade da mãe na concepção" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.idadeMae} onChangeField={handleFieldChange} />
          <CustomTextInput style={styles.inputField} field="idadePai" placeholder="Idade do pai na concepção" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.idadePai} onChangeField={handleFieldChange} />
          <BooleanPill label="Acompanhamento pré-natal?" field="prenatal" formData={formData} setFormData={setFormData} />
          
          <MultiSelectPillGroup 
            label="Complicações na Gestação" 
            field="complGestacao" 
            options={['Sangramento', 'Enjoo intenso', 'Febre', 'Ameaça aborto', 'Medicamentos', 'Uso de Álcool/Drogas']} 
            formData={formData} 
            setFormData={setFormData} 
          />
          <CustomTextInput style={styles.textArea} multiline field="doencasGestacao" placeholder="Doenças durante a gestação (ex: Diabetes, Rubéola, Hipertensão)..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.doencasGestacao} onChangeField={handleFieldChange} />
        </Accordion>
        
        <Accordion title="Parto" icon={Activity} color="#34D399" fields={['tipoParto', 'chorouAoNascer', 'uti', 'ictericia', 'pesoNascer', 'alturaNascer']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <SelectPillGroup label="Tipo de Parto" field="tipoParto" options={['Normal', 'Cesariana', 'Fórceps']} formData={formData} setFormData={setFormData} />
          <BooleanPill label="Bebê chorou logo que nasceu?" field="chorouAoNascer" formData={formData} setFormData={setFormData} />
          <BooleanPill label="Precisou de oxigênio ou UTI?" field="uti" formData={formData} setFormData={setFormData} />
          <BooleanPill label="Teve icterícia?" field="ictericia" formData={formData} setFormData={setFormData} />
          
          <Text style={styles.sectionSubtitle}>Medidas físicas do recém-nascido:</Text>
          <View style={styles.pillGroupContainer}>
            <Text style={styles.pillGroupLabel}>Peso ao nascer (em kilos / kg)</Text>
            <CustomTextInput 
              style={styles.inputField} 
              field="pesoNascer"
              placeholder="Ex: 3.4 kg" 
              placeholderTextColor="rgba(255,255,255,0.4)" 
              keyboardType="numeric" 
              value={formData.pesoNascer} 
              onChangeField={handleFieldChange} 
            />
          </View>

          <View style={styles.pillGroupContainer}>
            <Text style={styles.pillGroupLabel}>Comprimento/Altura ao nascer (em centímetros / cm)</Text>
            <CustomTextInput 
              style={styles.inputField} 
              field="alturaNascer"
              placeholder="Ex: 50 cm" 
              placeholderTextColor="rgba(255,255,255,0.4)" 
              keyboardType="numeric" 
              value={formData.alturaNascer} 
              onChangeField={handleFieldChange} 
            />
          </View>
        </Accordion>

        <Accordion title="Marcos do Desenvolvimento" icon={TrendingUp} color="#60A5FA" fields={['sentar', 'andar', 'primeirasPalavras', 'desfralde', 'tiques']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <Text style={styles.sectionSubtitle}>Idade (em meses) que começou a:</Text>
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} field="sentar" placeholder="Sentar" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.sentar} onChangeField={handleFieldChange} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} field="andar" placeholder="Andar" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.andar} onChangeField={handleFieldChange} />
          </View>
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} field="primeirasPalavras" placeholder="Primeiras palavras" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.primeirasPalavras} onChangeField={handleFieldChange} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} field="desfralde" placeholder="Desfralde" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.desfralde} onChangeField={handleFieldChange} />
          </View>

          <BooleanPill label="Apresenta ou já apresentou tiques?" field="tiques" formData={formData} setFormData={setFormData} />
        </Accordion>

        <Accordion title="Sono & Alimentação" icon={Moon} color="#A855F7" fields={['alimentacaoInfancia', 'alimentacaoAtual', 'sonoTranquilo', 'horasSono', 'dormeSozinho', 'disturbiosSono']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <SelectPillGroup label="Alimentação na infância" field="alimentacaoInfancia" options={['Materna', 'Mamadeira', 'Mista']} formData={formData} setFormData={setFormData} />
          <SelectPillGroup label="Alimentação atual" field="alimentacaoAtual" options={['Boa', 'Recusa alimentos', 'Muito seletiva', 'Compulsiva']} formData={formData} setFormData={setFormData} />
          
          <BooleanPill label="Sono tranquilo?" field="sonoTranquilo" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.inputField} field="horasSono" placeholder="Quantas horas de sono por noite?" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.horasSono} onChangeField={handleFieldChange} />
          <BooleanPill label="Dorme sozinho no próprio quarto?" field="dormeSozinho" formData={formData} setFormData={setFormData} />
          
          <MultiSelectPillGroup 
            label="Distúrbios noturnos" 
            field="disturbiosSono" 
            options={['Fala dormindo', 'Sonambulismo', 'Terror Noturno', 'Bruxismo (range dentes)', 'Enurese (xixi na cama)']} 
            formData={formData} 
            setFormData={setFormData} 
          />
        </Accordion>

        <Accordion title="Sexualidade" icon={Heart} color="#F43F5E" fields={['curiosidadeSexual', 'manipulacao', 'orientacaoSexual', 'relatosSex']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <BooleanPill label="Curiosidade sexual excessiva?" field="curiosidadeSexual" formData={formData} setFormData={setFormData} />
          <BooleanPill label="Manipulação frequente?" field="manipulacao" formData={formData} setFormData={setFormData} />
          <BooleanPill label="Já recebeu orientação sexual em casa?" field="orientacaoSexual" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.textArea} multiline field="relatosSex" placeholder="Para adolescentes: Relatos sobre menarca, cólicas, etc..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.relatosSex} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion title="História Médica" icon={Shield} color="#3B82F6" fields={['doencasAnteriores', 'traumatismo', 'enxaqueca', 'convulsao', 'detalhesMedicos']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <MultiSelectPillGroup 
            label="Doenças Anteriores" 
            field="doencasAnteriores" 
            options={['Meningite', 'Pneumonia', 'Sarampo', 'Infecção Urinária', 'Alergias severas']} 
            formData={formData} 
            setFormData={setFormData} 
          />
          <BooleanPill label="Traumatismo Craniano ou Perda de consciência?" field="traumatismo" formData={formData} setFormData={setFormData} />
          <BooleanPill label="Dores de cabeça frequentes / Enxaqueca?" field="enxaqueca" formData={formData} setFormData={setFormData} />
          <BooleanPill label="Episódios de crises convulsivas?" field="convulsao" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.textArea} multiline field="detalhesMedicos" placeholder="Detalhes sobre problemas neurológicos, gastrointestinais ou cardiovasculares..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.detalhesMedicos} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion title="Ambiente Familiar e Social" icon={Users} color="#10B981" fields={['situacaoPais', 'relacionamentos', 'interacaoSocial']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <SelectPillGroup label="Situação dos pais" field="situacaoPais" options={['Vivem juntos', 'Separados', 'Viúvo(a)']} formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.textArea} multiline field="relacionamentos" placeholder="Relacionamento com o pai, mãe e irmãos..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.relacionamentos} onChangeField={handleFieldChange} />
          
          <MultiSelectPillGroup 
            label="Interação Social" 
            field="interacaoSocial" 
            options={['Evita contato social', 'Agressivo com colegas', 'Muito submisso', 'Boa interação', 'Evita grupos']} 
            formData={formData} 
            setFormData={setFormData} 
          />
        </Accordion>

        <Accordion title="Escolaridade" icon={Book} color="#F59E0B" fields={['gostaEscola', 'dificuldadeEscolar', 'historicoEscolar']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <BooleanPill label="Gosta de ir à escola?" field="gostaEscola" formData={formData} setFormData={setFormData} />
          <MultiSelectPillGroup 
            label="Dificuldades aparentes" 
            field="dificuldadeEscolar" 
            options={['Leitura', 'Aritmética', 'Ortografia', 'Socialização', 'Concentração']} 
            formData={formData} 
            setFormData={setFormData} 
          />
          <CustomTextInput style={styles.textArea} multiline field="historicoEscolar" placeholder="Resumo do histórico escolar, reprovações, reclamações da escola..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.historicoEscolar} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion title="Tratamentos & Medicação" icon={Pill} color="#EF4444" fields={['tratamentos', 'usoMedicacao', 'medicacoes']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <CustomTextInput style={styles.textArea} multiline field="tratamentos" placeholder="Tratamentos anteriores ou atuais (Neurologista, Psiquiatra, Fono, etc)..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.tratamentos} onChangeField={handleFieldChange} />
          
          <BooleanPill label="Uso frequente de medicação?" field="usoMedicacao" formData={formData} setFormData={setFormData} />
          <CustomTextInput style={styles.inputField} field="medicacoes" placeholder="Quais medicações? (Nome e dosagem)" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.medicacoes} onChangeField={handleFieldChange} />
        </Accordion>

        <Accordion title="Observações Finais" icon={Stethoscope} color="#8B5CF6" fields={['impressaoGeral', 'planoIntervencao']} expandedSection={expandedSection} toggleSection={toggleSection} formData={formData}>
          <CustomTextInput style={styles.textArea} multiline field="impressaoGeral" placeholder="Impressão geral do psicólogo sobre a família e a criança..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.impressaoGeral} onChangeField={handleFieldChange} />
          <CustomTextInput style={styles.textArea} multiline field="planoIntervencao" placeholder="Plano inicial de intervenção e tratamento..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.planoIntervencao} onChangeField={handleFieldChange} />
        </Accordion>

        {/* Seção Fixa de Exclusão (Sempre Aberta, não minimizável, com SVG no canto superior direito) */}
        {Object.keys(formData).length > 0 && (
          <View style={styles.dangerCardFixed}>
            {/* Fundo SVG Watermark no canto superior direito igual aos outros tópicos */}
            <View style={[styles.cardBgIcon, { opacity: 0.15 }]}>
              <Trash2 size={160} color="#EF4444" />
            </View>

            <View style={styles.dangerCardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
                <Trash2 size={20} color="#EF4444" />
              </View>

              <View style={styles.titleColumn}>
                <Text style={styles.dangerCardTitle}>Excluir Anamnese</Text>
                <Text style={styles.dangerCardSubtitle}>Zona de Perigo</Text>
              </View>
            </View>

            <View style={styles.dangerCardContent}>
              <Text style={styles.dangerZoneText}>
                Atenção: Ao confirmar a exclusão, todos os dados da anamnese serão desativados no banco de dados e os campos deste formulário serão completamente limpos.
              </Text>

              <TouchableOpacity 
                style={styles.dangerCardButton} 
                onPress={() => setShowDeleteModal(true)}
                disabled={saving}
              >
                <Trash2 size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.dangerCardButtonText}>Excluir e Resetar Anamnese</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal de Confirmação de Exclusão da Anamnese (Estilo Teko) */}
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
            <Text style={styles.modalTitleRed}>Excluir Anamnese?</Text>
            <Text style={styles.modalMessage}>
              Tem certeza que deseja excluir todos os dados da anamnese deste paciente? Esta ação desativará as informações no banco de dados e resetará todos os campos.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButtonRed}
                onPress={confirmDelete}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmTextRed}>Sim, Excluir</Text>
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
            <ActivityIndicator color="#181c1c" style={{ marginRight: 8 }} />
          ) : (
            <Save size={20} color="#181c1c" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.saveText}>{saving ? "Salvando..." : "Salvar Anamnese"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  accordionContainer: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative'
  },
  cardBgIcon: {
    position: 'absolute',
    top: -30,
    right: -20,
    pointerEvents: 'none'
  },
  accordionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
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
    borderRadius: 12, 
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  accordionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff',
    flexShrink: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4
  },
  progressText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  accordionContent: { 
    padding: 16, 
    paddingTop: 0,
    zIndex: 1
  },
  
  inputLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 12,
  },
  inputField: { 
    borderRadius: 12, 
    paddingHorizontal: 16,
    height: 52,
    color: '#fff', 
    fontSize: 15, 
    marginBottom: 12,
    borderWidth: 1
  },
  textArea: { 
    borderRadius: 12, 
    padding: 16, 
    color: '#fff', 
    fontSize: 15, 
    minHeight: 120, 
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  pillGroupContainer: {
    marginBottom: 16,
  },
  pillGroupLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillWrap: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#181c1c',
    fontWeight: 'bold',
  },

  /* Card Fixo de Exclusão (Sempre Aberto) */
  dangerCardFixed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    overflow: 'hidden',
    position: 'relative',
  },
  dangerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    zIndex: 1,
  },
  dangerCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4D4D',
  },
  dangerCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,77,77,0.7)',
    marginTop: 2,
  },
  dangerCardContent: {
    padding: 16,
    paddingTop: 0,
    zIndex: 1,
  },
  dangerZoneText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  dangerCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  dangerCardButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Modal Estilo Teko */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainerRed: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0c2423',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
    alignItems: 'center',
  },
  modalIconBgRed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  modalTitleRed: {
    color: '#FF4B4B',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalConfirmButtonRed: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FF4B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextRed: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  fabContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    zIndex: 10,
  },
  saveFab: { 
    flexDirection: 'row', 
    backgroundColor: '#FFC857', 
    paddingHorizontal: 28, 
    paddingVertical: 16, 
    borderRadius: 32, 
    alignItems: 'center', 
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8 
  },
  saveText: { 
    color: '#181c1c', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});
