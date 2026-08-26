import React, { useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, UIManager, LayoutAnimation, Pressable } from 'react-native';
import { Save, ChevronDown, ChevronUp, User, Baby, Activity, TrendingUp, Moon, Heart, Shield, Users, Book, Pill, FileText, Stethoscope, CheckCircle2, Circle, CircleDashed } from 'lucide-react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ThemeContext = createContext('#7B61FF');

export function AnamneseTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>('Motivo da Consulta');
  const [formData, setFormData] = useState<any>({});

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(prev => prev === section ? null : section);
  };

  const Accordion = ({ title, icon: Icon, color = "#7B61FF", fields = [], children }: any) => {
    const isExpanded = expandedSection === title;

    // Calculation of progress
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
          
          {/* Fundo SVG Watermark (sempre visível no card) */}
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
  };

  const CustomTextInput = ({ style, ...props }: any) => {
    const color = useContext(ThemeContext);
    return (
      <TextInput 
        style={[
          style, 
          { borderColor: `${color}40`, backgroundColor: 'rgba(0,0,0,0.2)' },
          props.value || props.defaultValue ? { borderColor: color, backgroundColor: `${color}15` } : null
        ]} 
        {...props} 
      />
    );
  };

  const BooleanPill = ({ label, field }: { label: string, field: string }) => {
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
  };

  const SelectPillGroup = ({ label, field, options }: { label: string, field: string, options: string[] }) => {
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
  };

  const MultiSelectPillGroup = ({ label, field, options }: { label: string, field: string, options: string[] }) => {
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
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Accordion title="Motivo da Consulta" icon={FileText} color="#FFC857" fields={['queixa']}>
          <Text style={styles.inputLabel}>Queixa Principal</Text>
          <CustomTextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Descreva detalhadamente a queixa que motivou a consulta..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formData.queixa || ''}
            onChangeText={(t: string) => setFormData((p: any) => ({ ...p, queixa: t }))}
          />
        </Accordion>

        <Accordion title="Gestação e Concepção" icon={Baby} color="#EC4899" fields={['desejada', 'idadeMae', 'idadePai', 'prenatal', 'complGestacao', 'doencasGestacao']}>
          <BooleanPill label="Criança planejada/desejada?" field="desejada" />
          <CustomTextInput style={styles.inputField} placeholder="Idade da mãe na concepção" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.idadeMae} onChangeText={(t: string) => setFormData((p: any) => ({...p, idadeMae: t}))} />
          <CustomTextInput style={styles.inputField} placeholder="Idade do pai na concepção" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.idadePai} onChangeText={(t: string) => setFormData((p: any) => ({...p, idadePai: t}))} />
          <BooleanPill label="Acompanhamento pré-natal?" field="prenatal" />
          
          <MultiSelectPillGroup 
            label="Complicações na Gestação" 
            field="complGestacao" 
            options={['Sangramento', 'Enjoo intenso', 'Febre', 'Ameaça aborto', 'Medicamentos', 'Uso de Álcool/Drogas']} 
          />
          <CustomTextInput style={styles.textArea} multiline placeholder="Doenças durante a gestação (ex: Diabetes, Rubéola, Hipertensão)..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.doencasGestacao} onChangeText={(t: string) => setFormData((p: any) => ({...p, doencasGestacao: t}))} />
        </Accordion>
        
        <Accordion title="Parto" icon={Activity} color="#34D399" fields={['tipoParto', 'chorouAoNascer', 'uti', 'ictericia', 'pesoNascer', 'alturaNascer']}>
          <SelectPillGroup label="Tipo de Parto" field="tipoParto" options={['Normal', 'Cesariana', 'Fórceps']} />
          <BooleanPill label="Bebê chorou logo que nasceu?" field="chorouAoNascer" />
          <BooleanPill label="Precisou de oxigênio ou UTI?" field="uti" />
          <BooleanPill label="Teve icterícia?" field="ictericia" />
          
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} placeholder="Peso ao nascer" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.pesoNascer} onChangeText={(t: string) => setFormData((p: any) => ({...p, pesoNascer: t}))} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} placeholder="Altura ao nascer" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.alturaNascer} onChangeText={(t: string) => setFormData((p: any) => ({...p, alturaNascer: t}))} />
          </View>
        </Accordion>

        <Accordion title="Marcos do Desenvolvimento" icon={TrendingUp} color="#60A5FA" fields={['sentar', 'andar', 'primeirasPalavras', 'desfralde', 'tiques']}>
          <Text style={styles.sectionSubtitle}>Idade (em meses) que começou a:</Text>
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} placeholder="Sentar" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.sentar} onChangeText={(t: string) => setFormData((p: any) => ({...p, sentar: t}))} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} placeholder="Andar" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" value={formData.andar} onChangeText={(t: string) => setFormData((p: any) => ({...p, andar: t}))} />
          </View>
          <View style={styles.row}>
            <CustomTextInput style={[styles.inputField, { flex: 1, marginRight: 8 }]} placeholder="Primeiras palavras" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.primeirasPalavras} onChangeText={(t: string) => setFormData((p: any) => ({...p, primeirasPalavras: t}))} />
            <CustomTextInput style={[styles.inputField, { flex: 1, marginLeft: 8 }]} placeholder="Desfralde" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.desfralde} onChangeText={(t: string) => setFormData((p: any) => ({...p, desfralde: t}))} />
          </View>

          <MultiSelectPillGroup 
            label="Hábitos / Tiques" 
            field="tiques" 
            options={['Chupeta', 'Chupou o dedo', 'Roeu unha', 'Tiques faciais/motores']} 
          />
        </Accordion>

        <Accordion title="Sono" icon={Moon} color="#A78BFA" fields={['qualidadeSono', 'disturbiosSono']}>
          <SelectPillGroup label="Qualidade do Sono" field="qualidadeSono" options={['Dorme bem', 'Dificuldade para iniciar', 'Acorda muito', 'Despertar precoce']} />
          <MultiSelectPillGroup 
            label="Distúrbios noturnos" 
            field="disturbiosSono" 
            options={['Fala dormindo', 'Sonambulismo', 'Terror Noturno', 'Bruxismo (range dentes)', 'Enurese (xixi na cama)']} 
          />
        </Accordion>

        <Accordion title="Sexualidade" icon={Heart} color="#F43F5E" fields={['curiosidadeSexual', 'manipulacao', 'orientacaoSexual', 'relatosSex']}>
          <BooleanPill label="Curiosidade sexual excessiva?" field="curiosidadeSexual" />
          <BooleanPill label="Manipulação frequente?" field="manipulacao" />
          <BooleanPill label="Já recebeu orientação sexual em casa?" field="orientacaoSexual" />
          <CustomTextInput style={styles.textArea} multiline placeholder="Para adolescentes: Relatos sobre menarca, cólicas, etc..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.relatosSex} onChangeText={(t: string) => setFormData((p: any) => ({...p, relatosSex: t}))} />
        </Accordion>

        <Accordion title="História Médica" icon={Shield} color="#3B82F6" fields={['doencasAnteriores', 'traumatismo', 'enxaqueca', 'convulsao', 'detalhesMedicos']}>
          <MultiSelectPillGroup 
            label="Doenças Anteriores" 
            field="doencasAnteriores" 
            options={['Meningite', 'Pneumonia', 'Sarampo', 'Infecção Urinária', 'Alergias severas']} 
          />
          <BooleanPill label="Traumatismo Craniano ou Perda de consciência?" field="traumatismo" />
          <BooleanPill label="Dores de cabeça frequentes / Enxaqueca?" field="enxaqueca" />
          <BooleanPill label="Episódios de crises convulsivas?" field="convulsao" />
          <CustomTextInput style={styles.textArea} multiline placeholder="Detalhes sobre problemas neurológicos, gastrointestinais ou cardiovasculares..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.detalhesMedicos} onChangeText={(t: string) => setFormData((p: any) => ({...p, detalhesMedicos: t}))} />
        </Accordion>

        <Accordion title="Ambiente Familiar e Social" icon={Users} color="#10B981" fields={['situacaoPais', 'relacionamentos', 'interacaoSocial']}>
          <SelectPillGroup label="Situação dos pais" field="situacaoPais" options={['Vivem juntos', 'Separados', 'Viúvo(a)']} />
          <CustomTextInput style={styles.textArea} multiline placeholder="Relacionamento com o pai, mãe e irmãos..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.relacionamentos} onChangeText={(t: string) => setFormData((p: any) => ({...p, relacionamentos: t}))} />
          
          <MultiSelectPillGroup 
            label="Interação Social" 
            field="interacaoSocial" 
            options={['Evita contato social', 'Agressivo com colegas', 'Muito submisso', 'Boa interação', 'Evita grupos']} 
          />
        </Accordion>

        <Accordion title="Escolaridade" icon={Book} color="#F59E0B" fields={['gostaEscola', 'dificuldadeEscolar', 'historicoEscolar']}>
          <BooleanPill label="Gosta de ir à escola?" field="gostaEscola" />
          <MultiSelectPillGroup 
            label="Dificuldades aparentes" 
            field="dificuldadeEscolar" 
            options={['Leitura', 'Aritmética', 'Ortografia', 'Socialização', 'Concentração']} 
          />
          <CustomTextInput style={styles.textArea} multiline placeholder="Resumo do histórico escolar, reprovações, reclamações da escola..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.historicoEscolar} onChangeText={(t: string) => setFormData((p: any) => ({...p, historicoEscolar: t}))} />
        </Accordion>

        <Accordion title="Tratamentos & Medicação" icon={Pill} color="#EF4444" fields={['tratamentos', 'usoMedicacao', 'medicacoes']}>
          <CustomTextInput style={styles.textArea} multiline placeholder="Tratamentos anteriores ou atuais (Neurologista, Psiquiatra, Fono, etc)..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.tratamentos} onChangeText={(t: string) => setFormData((p: any) => ({...p, tratamentos: t}))} />
          
          <BooleanPill label="Uso frequente de medicação?" field="usoMedicacao" />
          <CustomTextInput style={styles.inputField} placeholder="Quais medicações? (Nome e dosagem)" placeholderTextColor="rgba(255,255,255,0.4)" value={formData.medicacoes} onChangeText={(t: string) => setFormData((p: any) => ({...p, medicacoes: t}))} />
        </Accordion>

        <Accordion title="Observações Finais" icon={Stethoscope} color="#8B5CF6" fields={['impressaoGeral', 'planoIntervencao']}>
          <CustomTextInput style={styles.textArea} multiline placeholder="Impressão geral do psicólogo sobre a família e a criança..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.impressaoGeral} onChangeText={(t: string) => setFormData((p: any) => ({...p, impressaoGeral: t}))} />
          <CustomTextInput style={styles.textArea} multiline placeholder="Plano inicial de intervenção e tratamento..." placeholderTextColor="rgba(255,255,255,0.4)" value={formData.planoIntervencao} onChangeText={(t: string) => setFormData((p: any) => ({...p, planoIntervencao: t}))} />
        </Accordion>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Pressable 
        style={({ pressed, hovered }: any) => [
          styles.saveFab,
          (pressed || hovered) && { backgroundColor: '#7B61FF', shadowColor: '#7B61FF' }
        ]}
      >
        {({ pressed, hovered }: any) => {
          const isActive = pressed || hovered;
          const color = isActive ? '#FFFFFF' : '#181c1c';
          return (
            <>
              <Save size={20} color={color} style={{ marginRight: 8 }} />
              <Text style={[styles.saveText, { color }]}>Salvar Anamnese</Text>
            </>
          );
        }}
      </Pressable>
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

  saveFab: { 
    position: 'absolute', 
    bottom: 24, 
    alignSelf: 'center', 
    flexDirection: 'row', 
    backgroundColor: '#FFC857', 
    paddingHorizontal: 24, 
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
