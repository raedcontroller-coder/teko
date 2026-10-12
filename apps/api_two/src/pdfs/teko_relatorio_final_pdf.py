from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Sequence

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import Paragraph

from teko_pdf_system_assets import TekoPDF, TocItem


TRANSLATIONS_REPORT = {
    "pt": {
        "footer_label": "RELATÓRIO FINAL",
        "section_prefix": "RELATÓRIO FINAL  •  SEÇÃO",
        "slogan": "Compreender para cuidar.",
        "cover_title": "Relatório Final",
        "cover_subtitle": "de Acompanhamento",
        "cover_desc": "Estrutura padronizada para integração de telemetria gamificada, métricas cognitivas, contexto clínico e rastreabilidade.",
        "cover_note": "Documento de avaliação neuropsicológica gerado com os biomarcadores digitais Teko.",
        "toc_title": "Sumário",
        "toc_note": "Estrutura padronizada do relatório final com síntese de telemetria, análise comportamental e conduta clínica.",
        "conclusion_title": "Conclusão",
        "sections": {
            "01": "Identificação",
            "02": "Motivo da avaliação",
            "03": "Metodologia",
            "04": "Variáveis do modelo",
            "05": "Resultado dos jogos",
            "06": "Síntese comportamental",
            "07": "Modelo probabilístico",
            "08": "Contextualização clínica",
            "09": "Integração dos achados",
            "10": "Pontos para consideração profissional",
            "11": "Conclusão",
            "12": "Assinatura e rastreabilidade"
        },
        "fields": {
            "patient_name": "Nome do paciente",
            "age": "Idade",
            "gender": "Gênero",
            "guardian": "Responsável",
            "app_date": "Data da aplicação",
            "psychologist": "Psicólogo(a) responsável",
            "crp": "Registro profissional (CRP)",
            "clinic": "Clínica / Instituição",
            "battery_status": "Status de completude da bateria",
            "games_performed": "Jogos realizados",
            "eval_objective": "Objetivo da avaliação",
            "main_complaint": "Queixa principal",
            "initial_context": "Contexto inicial resumido",
            "methodology_desc": "Descrição metodológica",
            "session_conditions": "Condições da aplicação e qualidade da sessão",
            "effective_variables": "Variáveis efetivamente utilizadas nesta aplicação",
            "exclusions_obs": "Observações sobre exclusões, dados ausentes ou qualidade técnica",
            "goleiro_synthesis": "Síntese Clínica e Evolução: Jogo do Goleiro",
            "toca_synthesis": "Síntese Clínica e Evolução: Jogo Toca Rápido",
            "photographer_synthesis": "Síntese Clínica e Evolução: Fotógrafo da Floresta",
            "response_variability": "1. Variabilidade da resposta",
            "inhibitory_control": "2. Controle inibitório",
            "sustained_attention": "3. Atenção sustentada",
            "joint_interpretation": "4. Interpretação conjunta",
            "variables_used": "Fundamentação dos biomarcadores ponderados",
            "anamnese_summary": "Anamnese detalhada (desenvolvimento, histórico escolar, sono, saúde e rotina)",
            "clinical_notes": "Notas clínicas e observações do prontuário",
            "history_summary": "Histórico das sessões e evolução das aplicações",
            "findings_relation": "Relação entre telemetria gamificada, anamnese e notas clínicas",
            "convergences": "Convergências observadas",
            "divergences": "Divergências e aspectos preservados",
            "integrated_synthesis": "Síntese integrada e parecer neuropsicológico",
            "games_result": "Resultado dos jogos",
            "probabilistic_result": "Resultado probabilístico",
            "clinical_relation": "Relação com contexto clínico",
            "caveats": "Ressalvas e interpretação profissional",
            "generation_date": "Data de geração",
            "report_id": "ID do relatório",
            "doc_hash": "Hash / identificador de autenticidade",
            "investigation_focus": "Investigação e Foco Clínico",
            "school_adaptations": "Adaptações no Ambiente Escolar",
            "followup_reeval": "Acompanhamento e Reavaliação",
            "complementary_scales": "Instrumentos e Escalas Complementares",
            "routine_sleep": "Rotina, Sono e Fatores Ambientais",
            "traceability_validity": "Autenticidade e Validade Técnica",
            "var_vtr_title": "1. Variabilidade da Resposta",
            "var_imp_title": "2. Controle Inibitório",
            "var_qa_title": "3. Atenção Sustentada",
            "var_age_title": "4. Idade e Normalização"
        }
    },
    "en": {
        "footer_label": "FINAL REPORT",
        "section_prefix": "FINAL REPORT  •  SECTION",
        "slogan": "Understanding to care.",
        "cover_title": "Final Report",
        "cover_subtitle": "Monitoring & Assessment",
        "cover_desc": "Standardized framework for gamified telemetry integration, cognitive metrics, clinical context, and traceability.",
        "cover_note": "Neuropsychological assessment document generated with Teko digital biomarkers.",
        "toc_title": "Table of Contents",
        "toc_note": "Standardized final report structure with telemetry synthesis, behavioral analysis, and clinical conduct.",
        "conclusion_title": "Conclusion",
        "sections": {
            "01": "Identification",
            "02": "Reason for Assessment",
            "03": "Methodology",
            "04": "Model Variables",
            "05": "Game Results",
            "06": "Behavioral Synthesis",
            "07": "Probabilistic Model",
            "08": "Clinical Contextualization",
            "09": "Integration of Findings",
            "10": "Professional Considerations",
            "11": "Conclusion",
            "12": "Signature & Traceability"
        },
        "fields": {
            "patient_name": "Patient's Name",
            "age": "Age",
            "gender": "Gender",
            "guardian": "Guardian",
            "app_date": "Assessment Date",
            "psychologist": "Responsible Psychologist",
            "crp": "Professional License (CRP)",
            "clinic": "Clinic / Institution",
            "battery_status": "Battery Completion Status",
            "games_performed": "Completed Games",
            "eval_objective": "Assessment Objective",
            "main_complaint": "Main Complaint",
            "initial_context": "Initial Context Summary",
            "methodology_desc": "Methodological Description",
            "session_conditions": "Session Conditions & Technical Quality",
            "effective_variables": "Variables Effectively Used in Assessment",
            "exclusions_obs": "Observations on Exclusions, Missing Data or Quality",
            "goleiro_synthesis": "Clinical Synthesis & Evolution: Goalkeeper Game",
            "toca_synthesis": "Clinical Synthesis & Evolution: Tap Fast Game",
            "photographer_synthesis": "Clinical Synthesis & Evolution: Forest Photographer",
            "response_variability": "1. Response Variability",
            "inhibitory_control": "2. Inhibitory Control",
            "sustained_attention": "3. Sustained Attention",
            "joint_interpretation": "4. Joint Interpretation",
            "variables_used": "Biomarkers Rationale",
            "anamnese_summary": "Detailed Anamnesis (development, school history, sleep, health, routine)",
            "clinical_notes": "Clinical Notes and Session Observations",
            "history_summary": "Session History & Application Progress",
            "findings_relation": "Relationship between Telemetry, Anamnesis, and Clinical Notes",
            "convergences": "Observed Convergences",
            "divergences": "Divergences & Preserved Domains",
            "integrated_synthesis": "Integrated Synthesis & Clinical Opinion",
            "games_result": "Game Results",
            "probabilistic_result": "Probabilistic Result",
            "clinical_relation": "Relationship with Clinical Context",
            "caveats": "Caveats & Professional Interpretation",
            "generation_date": "Generation Date",
            "report_id": "Report ID",
            "doc_hash": "Document Hash / Authenticity ID",
            "investigation_focus": "Clinical Investigation & Therapeutic Focus",
            "school_adaptations": "School & Pedagogical Adaptations",
            "followup_reeval": "Monitoring & Re-evaluation Schedule",
            "complementary_scales": "Complementary Standardized Scales",
            "routine_sleep": "Routine, Sleep Hygiene & Lifestyle",
            "traceability_validity": "Authenticity & Technical Validity",
            "var_vtr_title": "1. Response Variability",
            "var_imp_title": "2. Inhibitory Control",
            "var_qa_title": "3. Sustained Attention",
            "var_age_title": "4. Age Standardization"
        }
    }
}


MOCK_RELATORIO_PT = {
    "lang": "pt",
    "patientName": "Lucas Gabriel Silva",
    "patientAge": "8 anos e 4 meses",
    "patientGender": "Masculino",
    "responsavel": "Helena Silva (Mãe)",
    "date": "01/10/2026",
    "psicologoName": "Dra. Mariana Costa",
    "psicologoCrp": "CRP 06/142589",
    "clinica": "Centro Teko de Neuropsicologia",
    "bateriaStatus": "Bateria Completa (100% concluída)",
    "jogosRealizados": "• Goleiro\n• Toca Rápido\n• Fotógrafo da Floresta",
    "objetivo": "Mapear biomarcadores digitais de regulação atencional, tempo de reação visomotor e controle inibitório através da bateria padronizada de jogos sérios da Teko.",
    "queixa": "Relatos escolares e familiares apontando inquietação motora, desatenção em tarefas de longa duração e episódios frequentes de impulsividade na execução de deveres de casa.",
    "contextoInicial": "Criança sem diagnósticos consolidados prévios. Rendimento acadêmico oscilante no 3º ano do Ensino Fundamental com boa sociabilidade e curiosidade intelectual.",
    "descricaoMetodologica": "A bateria Teko utiliza jogos sérios com telemetria contínua de micro-movimentos, tempo de resposta visomotora e taxas de precisão. O ecossistema avalia o perfil cognitivo em ambiente lúdico e engajador, mensurando latências em milissegundos sem sobrecarregar a criança com tarefas monótonas.",
    "condicoesSessao": "Aplicação presencial conduzida em consultório estruturado e silencioso, no período matutino. A criança apresentou excelente cooperação, alta motivação e aderência integral às instruções dos 3 jogos.",
    "vtrVar": "Mapeia a regularidade milissegundo a milissegundo das respostas motoras da criança frente a estímulos visuais rápidos no jogo do Goleiro.",
    "impVar": "Avalia a capacidade de desaceleração e freio motor diante de estímulos No-Go sob alta velocidade.",
    "qaVar": "Mensura a estabilidade e a persistência do foco, calculando a taxa de fadiga cognitiva ao longo dos blocos.",
    "idadeVar": "Compara os biomarcadores com amostras de referência normatizadas pela idade cronológica da criança.",
    "variaveisEfetivas": "Todas as variáveis biométricas de tempo de resposta, controle de inibição e sustentação atencional apresentaram consistência amostral e integridade na telemetria.",
    "observacoesExclusoes": "Nenhum bloco de teste precisou ser invalidado. Conexão estável e amostragem de toques com 100% de integridade técnica.",
    "vtr": "412 ms",
    "vtri": "85 ms",
    "goleiroPosicao": "Percentil 35 (Variabilidade Elevada)",
    "goleiroSintese": "Observou-se flutuação moderada nas latências de resposta, com respostas ágeis intercaladas por lapsos transitórios nos blocos mais avançados do jogo. Na análise temporal entre as sessões, nota-se gradativa redução de 445ms para 412ms, indicando prontidão visomotora positiva e atenuação de instabilidade de foco inicial.",
    "tocaComissao": "4 erros",
    "tocaTaxaErros": "40%",
    "tocaAcertos": "14 / 15",
    "tocaOmissoes": "1 / 15",
    "tocaSintese": "A criança demonstrou bom engajamento geral, contudo apresentou tendência a responder precipitadamente antes do processamento inibitório frente aos estímulos No-Go. A curva longitudinal evidencia redução progressiva de 6 para 4 erros de comissão, sugerindo ganho adaptativo de desaceleração motora sob orientação terapêutica.",
    "fotografoQa": "+38 ms",
    "fotografoInicial": "420 ms",
    "fotografoFinal": "458 ms",
    "fotografoInclinacao": "+38 ms",
    "fotografoSintese": "Evidenciou-se variação de latência entre os primeiros 6 minutos e os 6 minutos finais da atividade (+38 ms), indicando aumento gradual do custo de processamento cognitivo ao longo do tempo. O acompanhamento longitudinal demonstra que essa oscilação atencional se estabiliza com o treino, apontando que pausas programadas de descanso continuam sendo altamente eficazes para recuperação do foco da criança.",
    "variabilidade": "A oscilação no tempo de resposta aponta para momentos transitórios em que a prontidão atencional varia, característico de oscilação do foco durante tarefas contínuas.",
    "controleInibitorio": "Dificuldade moderada observada na desaceleração motora, gerando respostas precipitadas em alvos que exigiam suspensão do toque.",
    "atencaoSustentada": "Curva com desaceleração e aumento de latência da metade para o fim da sessão, compatível com fadiga cognitiva após esforço prolongado.",
    "interpretacaoConjunta": "O perfil integrado evidencia que a impulsividade motora associada à fadiga atencional representa o principal ponto de atenção no cotidiano da criança.",
    "probabilidade": "68% (Elevada Probabilidade de Perfil Atencional Compatível)",
    "dataVersao": "11/10/2026",
    "anamneseResumo": "Desenvolvimento motor e da fala dentro dos marcos esperados. Sono agitado relatado pela genitora com despertares noturnos ocasionais. Queixas escolares persistentes desde a transição de ciclo, com dificuldade de conclusão de tarefas em sala de aula.",
    "notasClinicas": "Criança curiosa, comunicativa e com intensa busca por novidade sensorial. Necessitou de reforço de instruções verbais para manter o foco na tela durante as transições de fases.",
    "historicoSessoes": "Registro de sessões sucessivas com curva de adaptação motora positiva, mantendo o padrão de oscilação atencional sob tarefas extensas.",
    "relacao": "Verifica-se forte correspondência entre o declínio de rendimento verificado na telemetria dos jogos e os relatos da equipe escolar sobre fadiga atencional e distração.",
    "convergencias": "A impulsividade detectada no Toca Rápido alinha-se diretamente aos relatos de impulsividade verbal e dificuldade em aguardar a vez em sala de aula.",
    "divergencias": "Excelente coordenação visomotora e raciocínio lúdico preservados, indicando bom potencial cognitivo global sem déficits motores de base.",
    "sinteseIntegrada": "O quadro geral sugere perfil neuropsicológico caracterizado por instabilidade no controle inibitório e fatigabilidade atencional, sem prejuízos intelectuais globais.",
    "consid1": "Investigar a relação entre a fatigabilidade cognitiva e os horários das matérias escolares mais complexas.",
    "consid2": "Implementar adaptações pedagógicas com subdivisão de tarefas longas em etapas curtas de 15 minutos.",
    "consid3": "Reavaliação neuropsicológica e telemetria de acompanhamento em 6 meses para monitorar a curva evolutiva.",
    "consid4": "Aplicação de escalas comportamentais complementares respondidas por professores e familiares (ex: SNAP-IV).",
    "consid5": "Orientação de higiene do sono e ajuste na rotina noturna para melhorar a prontidão atencional diurna.",
    "resultadoJogos": "Desempenho com variação de tempo de reação moderada e respostas impulsivas no No-Go acima da média esperada para a faixa etária.",
    "resultadoProbabilistico": "Probabilidade estimada de 68% para o perfil atencional avaliado através do modelo probabilístico de triagem.",
    "relacaoClinica": "Convergência expressiva entre os biomarcadores digitais coletados e os comportamentos observados em consulta presencial.",
    "ressalvas": "Este laudo representa um parecer técnico de triagem neuropsicológica e deve ser integrado à avaliação clínica qualitativa e multidisciplinar em consultório.",
    "reportId": "TEKO-REP-2026-0984",
    "hash": "SHA256: 8f9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    "telemetriaLongitudinal": [
        {"sessaoNum": 1, "data": "10/08/2026", "gameName": "Goleiro", "vtr": 445, "vtri": 98.2, "variacao_ms": 95, "qa": 95, "imp": 6},
        {"sessaoNum": 2, "data": "25/08/2026", "gameName": "Toca Rápido", "vtr": 430, "vtri": 91.0, "variacao_ms": 78, "qa": 78, "imp": 5},
        {"sessaoNum": 3, "data": "15/09/2026", "gameName": "Fotógrafo da Floresta", "vtr": 418, "vtri": 87.5, "variacao_ms": 52, "qa": 52, "imp": 4},
        {"sessaoNum": 4, "data": "01/10/2026", "gameName": "Bateria Completa", "vtr": 412, "vtri": 85.0, "variacao_ms": 38, "qa": 38, "imp": 4}
    ]
}

MOCK_RELATORIO_EN = {
    "lang": "en",
    "patientName": "Lucas Gabriel Silva",
    "patientAge": "8 years and 4 months",
    "patientGender": "Male",
    "responsavel": "Helena Silva (Mother)",
    "date": "10/01/2026",
    "psicologoName": "Dr. Mariana Costa",
    "psicologoCrp": "CRP 06/142589",
    "clinica": "Teko Neuropsychology Center",
    "bateriaStatus": "Complete Battery (100% completed)",
    "jogosRealizados": "• Goalkeeper\n• Tap Fast\n• Forest Photographer",
    "objetivo": "Map digital biomarkers of attentional regulation, visuomotor reaction time, and inhibitory control through Teko's standardized serious games battery.",
    "queixa": "School and family reports highlighting motor restlessness, inattention in long-duration tasks, and frequent impulsivity during homework completion.",
    "contextoInicial": "Child without prior consolidated diagnoses. Fluctuating academic performance in 3rd grade with good sociability and intellectual curiosity.",
    "descricaoMetodologica": "The Teko battery utilizes serious games with continuous telemetry of micro-movements, visuomotor response latency, and precision rates. The platform evaluates cognitive profiles in a playful environment, recording millisecond-accurate metrics without burdening the child.",
    "condicoesSessao": "In-person assessment in a structured and quiet office setting during morning hours. The child showed high cooperation, strong motivation, and full adherence to game instructions.",
    "vtrVar": "Measures millisecond-level regularity of motor responses to rapid visual stimuli in the Goalkeeper game.",
    "impVar": "Evaluates motor braking and deceleration capability during high-speed No-Go stimuli.",
    "qaVar": "Measures sustained focus stability and calculates cognitive fatigue rate across testing blocks.",
    "idadeVar": "Compares digital biomarkers with age-stratified normative reference samples.",
    "variaveisEfetivas": "All biometric variables for reaction time, inhibitory control, and sustained attention showed full sampling consistency and telemetry integrity.",
    "observacoesExclusoes": "No assessment block required technical exclusion. Stable connection and touch sampling with 100% technical integrity.",
    "vtr": "412 ms",
    "vtri": "85 ms",
    "goleiroPosicao": "35th Percentile (Elevated Variability)",
    "goleiroSintese": "Moderate fluctuation in response latencies, with quick reactions interspersed with transient lapses in the final blocks. Across sessions, latency stabilized from 445ms to 412ms, reflecting positive adaptation and reduced attentional jitter.",
    "tocaComissao": "4 errors",
    "tocaTaxaErros": "40%",
    "tocaAcertos": "14 / 15",
    "tocaOmissoes": "1 / 15",
    "tocaSintese": "Good overall engagement, with a tendency to respond hastily before inhibitory processing on No-Go stimuli. Across sessions, commission errors decreased from 6 to 4, demonstrating progressive motor deceleration adaptation under therapeutic guidance.",
    "fotografoQa": "+38 ms",
    "fotografoInicial": "420 ms",
    "fotografoFinal": "458 ms",
    "fotografoInclinacao": "+38 ms",
    "fotografoSintese": "Reaction latency shifted by +38 ms between the first 6 minutes and the concluding 6 minutes of the activity, indicating progressive cognitive fatigue accumulation over time. Longitudinal monitoring confirms that this focus fluctuation diminishes with practice, showing that planned rest breaks are clinically valuable for sustaining the child's attention.",
    "variabilidade": "Response time fluctuation highlights transient readiness shifts typical of focus oscillation during continuous tasks.",
    "controleInibitorio": "Moderate motor deceleration difficulty observed, leading to hasty taps on stimuli requiring impulse restraint.",
    "atencaoSustentada": "Reaction latency increased during the second half of the session, compatible with cognitive fatigue under prolonged effort.",
    "interpretacaoConjunta": "The integrated profile shows that motor impulsivity coupled with attentional fatigability is the child's key developmental challenge.",
    "probabilidade": "68% (High Probability of Attentive Profile)",
    "dataVersao": "10/11/2026",
    "anamneseResumo": "Motor and speech milestones achieved within expected chronological ranges. Mother reports restless sleep with occasional night awakenings. Persistent school complaints regarding task completion during continuous classroom instruction.",
    "notasClinicas": "Curious, highly communicative child with active sensory-seeking tendencies. Required verbal prompting and structure during stage transitions to maintain focus on the screen.",
    "historicoSessoes": "Sequential sessions demonstrate positive motor adaptation curve while maintaining characteristic attentional oscillation during lengthy tasks.",
    "relacao": "Marked convergence observed between telemetry performance decline in games and school reports regarding attentional fatigue and distractibility.",
    "convergencias": "Impulsivity detected during Tap Fast directly mirrors teacher reports of verbal impulsivity and turn-taking challenges in the classroom.",
    "divergencias": "Preserved visuomotor coordination and playful problem-solving ability, indicating strong global cognitive potential without underlying motor deficits.",
    "sinteseIntegrada": "Overall clinical picture indicates a neuropsychological profile marked by inhibitory instability and attentional fatigability, in the absence of generalized intellectual impairment.",
    "consid1": "Investigate correlation between cognitive fatigue and demanding academic class periods.",
    "consid2": "Implement pedagogical accommodations with long tasks segmented into 15-minute structured intervals.",
    "consid3": "Neuropsychological monitoring and telemetry follow-up in 6 months to evaluate developmental progression.",
    "consid4": "Administer complementary standardized rating scales completed by teachers and family (e.g., SNAP-IV).",
    "consid5": "Provide sleep hygiene counseling and evening routine structuring to support daytime attentional readiness.",
    "resultadoJogos": "Performance characterized by moderate reaction time variability and impulsive No-Go responses above chronological peer average.",
    "resultadoProbabilistico": "Estimated probability of 68% for the evaluated attentional profile derived from the standardized screening model.",
    "relacaoClinica": "High degree of consistency between collected digital biomarkers and qualitative behaviors observed in clinical consultation.",
    "ressalvas": "This document represents a technical neuropsychological screening opinion and must be contextualized with comprehensive in-person qualitative assessment.",
    "reportId": "TEKO-REP-2026-0984",
    "hash": "SHA256: 8f9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    "telemetriaLongitudinal": [
        {"sessaoNum": 1, "data": "08/10/2026", "gameName": "Goalkeeper", "vtr": 445, "vtri": 98.2, "variacao_ms": 95, "qa": 95, "imp": 6},
        {"sessaoNum": 2, "data": "08/25/2026", "gameName": "Tap Fast", "vtr": 430, "vtri": 91.0, "variacao_ms": 78, "qa": 78, "imp": 5},
        {"sessaoNum": 3, "data": "09/15/2026", "gameName": "Forest Photographer", "vtr": 418, "vtri": 87.5, "variacao_ms": 52, "qa": 52, "imp": 4},
        {"sessaoNum": 4, "data": "10/01/2026", "gameName": "Full Battery", "vtr": 412, "vtri": 85.0, "variacao_ms": 38, "qa": 38, "imp": 4}
    ]
}


class TekoFinalReportPDF(TekoPDF):
    """Template do Relatório Final da Teko com síntese clínica e evolutiva robusta para cada jogo e paginação dinâmica."""

    X = 47.0
    RIGHT = 459.0
    CONTENT_W = 412.0
    GAP = 12.0
    V_GAP = 14.0
    FIELD_H = 68.0
    HEADER_H = 30.0

    def __init__(self, output_path: str | Path, data: dict | None = None, asset_dir: str | Path | None = None, mock: bool = True):
        if asset_dir:
            root = Path(asset_dir)
        else:
            primary_assets = Path(__file__).resolve().parent / "assets"
            fallback_assets = Path(__file__).resolve().parent / "assets_anamnese"
            root = primary_assets if primary_assets.exists() else fallback_assets

        raw_data = data or {}
        lang_input = str(raw_data.get("lang", "pt")).lower()
        self.lang = "en" if lang_input.startswith("en") else "pt"
        self.t = TRANSLATIONS_REPORT[self.lang]

        default_mock = MOCK_RELATORIO_EN if self.lang == "en" else MOCK_RELATORIO_PT
        self.mock = mock
        self.data = {**default_mock, **raw_data} if (mock or data) else raw_data

        logo_path = root / "teko_logo.png"
        if not logo_path.exists():
            for name in ["teko_logo_logo_transparente.png", "teko_logo.png", "logo.png", "Teko_logo.png"]:
                if (root / name).exists():
                    logo_path = root / name
                    break

        top_corner = root / "top_corner.png"
        if not top_corner.exists() and (root / "elemento_ex_1.png").exists():
            top_corner = root / "elemento_ex_1.png"

        bottom_corner = root / "bottom_corner.png"
        if not bottom_corner.exists() and (root / "elemento_ex_2.png").exists():
            bottom_corner = root / "elemento_ex_2.png"

        super().__init__(
            output_path,
            logo_path=logo_path,
            top_corner_asset=top_corner,
            bottom_corner_asset=bottom_corner,
            footer_label=self.t["footer_label"],
        )
        self.asset_dir = root

        self.card_fill = HexColor("#FFFDF9")
        self.card_border = HexColor("#BCD6D0")
        self.purple_border = HexColor("#C9BCEB")
        self.soft_green = HexColor("#EAF4F1")
        self.soft_purple = HexColor("#F2EEFB")
        self.soft_yellow = HexColor("#FFF7D9")
        self.muted = HexColor("#687384")
        self.grid = HexColor("#D7E4E1")

        self.section_pages: dict[str, str] = {}

    def _get(self, key: str, default: str = "") -> str:
        return str(self.data.get(key, default))

    # Sobrescreve o rodapé para não desenhar número de página sobreposto ao SVG no canto inferior
    def _footer(self, page_no: str) -> None:
        self.c.saveState()
        self.c.setFillColor(self.theme.muted)
        self.c.setFont(self.fonts.body, 8)
        self.c.drawString(45, 30, f"TEKO  •  2026  •  {self.footer_label}")
        self.c.restoreState()

    # ------------------------------------------------------------------
    # Assets e Cabeçalho
    # ------------------------------------------------------------------
    def _draw_asset_right(self, path: Path, y: float, width: float,
                          top_anchor: bool = False, overscan: float = 0):
        if not path.exists():
            return
        im = ImageReader(str(path))
        iw, ih = im.getSize()
        h = width * ih / iw
        x = self.W - width + overscan
        draw_y = y - h if top_anchor else y
        self.c.drawImage(im, x, draw_y, width=width, height=h,
                         preserveAspectRatio=True, mask="auto")

    def _corner_motifs(self, *, bottom_leaves: bool = True) -> None:
        if self.top_corner_asset and self.top_corner_asset.exists():
            self._draw_asset_right(self.top_corner_asset, self.H + 4,
                                   width=198, top_anchor=True, overscan=8)
        if bottom_leaves and self.bottom_corner_asset and self.bottom_corner_asset.exists():
            self._draw_asset_right(self.bottom_corner_asset, -4,
                                   width=213, top_anchor=False, overscan=10)

    def _draw_logo(self, x: float, y_top: float, width: float = 160) -> None:
        if self.logo_path and self.logo_path.exists():
            im = ImageReader(str(self.logo_path))
            iw, ih = im.getSize()
            h = width * ih / iw
            self.c.drawImage(im, x, y_top - h, width=width, height=h,
                             preserveAspectRatio=True, mask="auto")

    def _wrap(self, text: str, font: str, size: float, max_width: float,
              max_lines: int = 2) -> list[str]:
        words = text.replace("<br/>", "\n").split()
        if not words:
            return []
        lines: list[str] = []
        cur = words[0]
        for word in words[1:]:
            trial = f"{cur} {word}"
            if pdfmetrics.stringWidth(trial, font, size) <= max_width:
                cur = trial
            else:
                lines.append(cur)
                cur = word
        lines.append(cur)
        if len(lines) <= max_lines:
            return lines
        if size > 7.0:
            return self._wrap(text, font, size - 0.2, max_width, max_lines)
        return lines[:max_lines]

    def _draw_label(self, text: str, x: float, y_top: float, w: float,
                    *, size: float = 8.6, color: Color | None = None,
                    max_lines: int = 2) -> float:
        font = self.fonts.body_semibold
        current_size = size
        while current_size > 7.0:
            lines = self._wrap(text, font, current_size, w, max_lines)
            if len(lines) <= max_lines:
                break
            current_size -= 0.2
        self.c.setFillColor(color or self.theme.green)
        self.c.setFont(font, current_size)
        start_y = y_top - 9.0
        yy = start_y - current_size
        for line in lines[:max_lines]:
            self.c.drawString(x, yy, line)
            yy -= current_size + 1.8
        bottom_offset = (y_top - yy) - 1.8 + (0.2 * current_size)
        return bottom_offset

    def _page_header(self, index: str, sec_key: str, page_no: str) -> float:
        sec_title = self.t["sections"][sec_key]
        self._begin_page(page_no="", motifs=True, logo=False)
        self._draw_tracking_text(f"{self.t['section_prefix']} {index}", self.X, self.H - 50,
                                 font=self.fonts.body_semibold, size=8.0,
                                 color=self.theme.navy, tracking=1.55)
        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(1.0)
        self.c.line(self.X, self.H - 100, self.X + 63, self.H - 100)
        self.c.setFillColor(self.theme.green)
        size = 28.0
        while size > 19 and pdfmetrics.stringWidth(sec_title, self.fonts.display, size) > 398:
            size -= 0.5
        self.c.setFont(self.fonts.display, size)
        self.c.drawString(self.X, self.H - 142, sec_title)

        # Numeração de página no cabeçalho superior direito (no lugar do número roxo fixo)
        self.c.setFillColor(self.theme.purple)
        self.c.setFont(self.fonts.display, 11.5)
        self.c.drawRightString(self.RIGHT, self.H - 114, str(page_no))
        return self.H - 180

    def _end_page(self):
        self.c.showPage()

    # ------------------------------------------------------------------
    # Cards e Painéis com Respiros Confortáveis e Altura Elástica
    # ------------------------------------------------------------------
    def _card(self, x: float, y: float, w: float, h: float,
              *, fill: Color | None = None, border: Color | None = None,
              radius: float = 8.5, line_width: float = 0.75):
        self.c.saveState()
        self.c.setFillColor(fill or self.card_fill)
        self.c.setStrokeColor(border or self.card_border)
        self.c.setLineWidth(line_width)
        self.c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
        self.c.restoreState()

    def _blank_field(self, field_key: str, x: float, y_top: float, w: float,
                     *, val: str = "", h: float | None = None, accent: Color | None = None,
                     fill: Color | None = None, custom_sep_offset: float | None = None) -> float:
        label = self.t["fields"].get(field_key, field_key)
        h = h or self.FIELD_H
        y = y_top - h
        self._card(x, y, w, h, fill=fill)
        accent = accent or self.theme.green
        self.c.setFillColor(accent)
        self.c.roundRect(x + 14, y_top - 7.5, 34, 3.0, 1.5, fill=1, stroke=0)
        bottom_offset = self._draw_label(label, x + 14, y_top + 2.0, w - 28, size=8.0,
                                         color=self.muted, max_lines=2)
        sep_offset = custom_sep_offset if custom_sep_offset is not None else max(self.HEADER_H, bottom_offset + 5.0)
        sep_y = y_top - sep_offset
        self.c.setStrokeColor(self.grid)
        self.c.setLineWidth(0.45)
        self.c.line(x + 14, sep_y, x + w - 14, sep_y)

        if val:
            self._paragraph(val, x + 14, sep_y - 6.0, w - 28,
                            font=self.fonts.body_semibold if len(val) < 25 else self.fonts.body,
                            size=9.2, leading=12.5, color=self.theme.navy)
        return y - self.V_GAP

    def _auto_panel(self, panel_key: str, x: float, y_top: float, w: float,
                    *, text: str = "", min_h: float = 75.0,
                    fill: Color | None = None, border: Color | None = None,
                    accent: Color | None = None, font_size: float = 9.0, leading: float = 13.0) -> float:
        """Painel elástico com separação dinâmica e generosos respiros entre título e parágrafo."""
        title = self.t["fields"].get(panel_key, panel_key)
        clean_text = (text or "").replace("\n", "<br/>")

        style = ParagraphStyle(
            name=f"AutoStyle_{panel_key}_{id(text)}",
            fontName=self.fonts.body,
            fontSize=font_size,
            leading=leading,
            textColor=self.theme.navy,
            alignment=TA_LEFT,
        )
        inner_padding = 16.0
        inner_w = w - (2 * inner_padding)
        p = Paragraph(clean_text if clean_text else "—", style)
        _, text_h = p.wrap(inner_w, 2000.0)

        # Mede a altura ocupada pelo título antes de definir o sep_y
        font = self.fonts.body_semibold
        title_lines = self._wrap(title, font, 9.2, inner_w, max_lines=2)
        title_line_count = max(1, len(title_lines))
        title_height = title_line_count * 11.5

        # Espaço reservado para o topo do card: pastilha de destaque no topo, título acima e respiro amplo até a linha divisória
        header_height = 14.0 + title_height + 10.0
        
        sep_y_offset = max(33.0, header_height)
        top_text_pad = 10.0
        bottom_pad = 16.0

        total_needed_h = sep_y_offset + top_text_pad + text_h + bottom_pad
        calc_h = max(min_h, total_needed_h)

        y = y_top - calc_h
        self._card(x, y, w, calc_h, fill=fill, border=border)
        accent = accent or self.theme.green
        self.c.setFillColor(accent)
        # Pastilha de destaque sutil bem no topo do card
        self.c.roundRect(x + inner_padding, y_top - 7.5, 42, 3.0, 1.5, fill=1, stroke=0)
        # Título desenhado bem no topo (subindo para dar respiro abundante em relação ao conteúdo textual)
        self._draw_label(title, x + inner_padding, y_top - 4.0, inner_w,
                         size=9.2, color=self.theme.navy, max_lines=2)

        sep_y = y_top - sep_y_offset
        self.c.setStrokeColor(border or self.card_border)
        self.c.setLineWidth(0.5)
        self.c.line(x + inner_padding, sep_y, x + w - inner_padding, sep_y)

        # Conteúdo textual com respiro amplo e limpo abaixo da linha divisória
        p.drawOn(self.c, x + inner_padding, sep_y - top_text_pad - text_h)
        return y - self.V_GAP

    def _row_fields(self, y_top: float, specs: Sequence[tuple[str, str, float, Color | None]],
                    *, h: float | None = None) -> float:
        x = self.X
        h = h or self.FIELD_H
        for field_key, val, width, accent in specs:
            self._blank_field(field_key, x, y_top, width, val=val, h=h, accent=accent)
            x += width + self.GAP
        return y_top - h - self.V_GAP

    def _section_note(self, text: str, y: float):
        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(0.8)
        self.c.line(self.X, y - 6, self.X, y + 54)
        style = ParagraphStyle(
            "note", fontName=self.fonts.body, fontSize=8.5, leading=12.0,
            textColor=self.theme.navy, alignment=TA_LEFT,
        )
        p = Paragraph(text, style)
        p.wrap(280, 80)
        p.drawOn(self.c, self.X + 17, y + 10)

    # ------------------------------------------------------------------
    # Gráficos com Eixos X e Y Nítidos, Escala Explícita e Área Preenchida
    # ------------------------------------------------------------------
    def _draw_area_chart(self, title: str, x: float, y_top: float, w: float, h: float,
                         data_points: list[float], *,
                         min_val: float | None = None, max_val: float | None = None, unit: str = "",
                         x_labels: list[str] | None = None,
                         x_axis_title: str = "Sessão",
                         y_axis_title: str = "Magnitude",
                         line_color: Color | None = None, fill_color: Color | None = None,
                         reference_line: float | None = None) -> float:
        y = y_top - h
        self._card(x, y, w, h)
        self._draw_label(title, x + 16, y_top - 18, w - 32,
                         size=9.2, color=self.theme.navy, max_lines=2)
        header_bottom = y_top - 36
        self.c.setStrokeColor(self.grid)
        self.c.setLineWidth(0.55)
        self.c.line(x + 16, header_bottom, x + w - 16, header_bottom)

        plot_x = x + 56
        plot_y = y + 36
        plot_w = w - 78
        plot_h = h - 90

        # Eixos evidentes e destacados
        self.c.setStrokeColor(self.theme.navy)
        self.c.setLineWidth(1.1)
        self.c.line(plot_x, plot_y, plot_x, plot_y + plot_h)
        self.c.line(plot_x, plot_y, plot_x + plot_w, plot_y)

        # Título do Eixo Y
        self.c.saveState()
        self.c.setFillColor(self.muted)
        self.c.setFont(self.fonts.body_semibold, 7.0)
        self.c.translate(plot_x - 42, plot_y + plot_h / 2.0)
        self.c.rotate(90)
        self.c.drawCentredString(0, 0, y_axis_title)
        self.c.restoreState()

        # Título do Eixo X
        self.c.setFillColor(self.muted)
        self.c.setFont(self.fonts.body_semibold, 7.0)
        self.c.drawCentredString(plot_x + plot_w / 2.0, plot_y - 22, x_axis_title)

        # Cálculo dinâmico e estritamente proporcional da escala vertical (Y)
        valid_points = [float(p) for p in data_points] if data_points else [0.0]
        actual_min = min(valid_points)
        actual_max = max(valid_points)

        if min_val is not None and max_val is not None:
            calc_min = min_val
            calc_max = max_val
            # Se algum dado ultrapassar os limites fixados, expande proporcionalmente
            if actual_min < calc_min:
                calc_min = max(0.0, actual_min * 0.9)
            if actual_max > calc_max:
                calc_max = actual_max * 1.15
        else:
            if actual_min == actual_max:
                calc_min = max(0.0, actual_min * 0.8)
                calc_max = actual_max * 1.25 if actual_max > 0 else 10.0
            else:
                rng = actual_max - actual_min
                calc_min = max(0.0, actual_min - (rng * 0.15))
                calc_max = actual_max + (rng * 0.15)

        denom = (calc_max - calc_min) if calc_max != calc_min else 1.0

        # Linhas guia do grid e marcações do Eixo Y
        self._set_alpha(stroke=0.45)
        self.c.setDash(1.5, 3.0)
        for i in range(1, 5):
            gy = plot_y + plot_h * (i / 4.0)
            self.c.line(plot_x, gy, plot_x + plot_w, gy)
            val_step = calc_min + denom * (i / 4.0)
            self.c.setFillColor(self.theme.navy)
            self.c.setFont(self.fonts.body, 7.0)
            self.c.drawRightString(plot_x - 6, gy - 2.5, f"{val_step:.0f}{unit}")
        self.c.setDash()
        self._reset_alpha()

        self.c.setFillColor(self.theme.navy)
        self.c.setFont(self.fonts.body, 7.0)
        self.c.drawRightString(plot_x - 6, plot_y - 2.5, f"{calc_min:.0f}{unit}")

        n = len(valid_points)
        coords = []

        for i, val in enumerate(valid_points):
            px = plot_x + (i / max(1, n - 1)) * plot_w if n > 1 else plot_x + (plot_w / 2.0)
            norm_val = max(0.0, min(1.0, (val - calc_min) / denom))
            py = plot_y + norm_val * plot_h
            coords.append((px, py))

            lbl = x_labels[i] if (x_labels and i < len(x_labels)) else str(i + 1)
            self.c.setFillColor(self.theme.navy)
            self.c.setFont(self.fonts.body, 6.8)
            self.c.drawCentredString(px, plot_y - 11, lbl)

        # Área preenchida estilizada
        actual_line = line_color or self.theme.green
        actual_fill = fill_color or HexColor("#EAF4F1")

        if coords:
            self.c.saveState()
            poly = self.c.beginPath()
            poly.moveTo(coords[0][0], plot_y)
            for px, py in coords:
                poly.lineTo(px, py)
            poly.lineTo(coords[-1][0], plot_y)
            poly.close()
            self.c.setFillColor(actual_fill)
            self.c.setStrokeColor(actual_fill)
            self._set_alpha(fill=0.6)
            self.c.drawPath(poly, stroke=0, fill=1)
            self._reset_alpha()

            # Linha superior de tendência
            if len(coords) > 1:
                self.c.setStrokeColor(actual_line)
                self.c.setLineWidth(2.0)
                line_path = self.c.beginPath()
                line_path.moveTo(coords[0][0], coords[0][1])
                for px, py in coords[1:]:
                    line_path.lineTo(px, py)
                self.c.drawPath(line_path, stroke=1, fill=0)

            # Marcadores de pontos
            for px, py in coords:
                self.c.setFillColor(HexColor("#FFFFFF"))
                self.c.setStrokeColor(actual_line)
                self.c.setLineWidth(1.5)
                self.c.circle(px, py, 3.2, fill=1, stroke=1)
                self.c.setFillColor(actual_line)
                self.c.circle(px, py, 1.6, fill=1, stroke=0)

            # Linha de corte de referência sem legenda de texto
            if reference_line is not None and calc_min <= reference_line <= calc_max:
                norm_ref = max(0.0, min(1.0, (reference_line - calc_min) / denom))
                ref_y = plot_y + norm_ref * plot_h
                self.c.setStrokeColor(self.theme.purple)
                self.c.setLineWidth(1.0)
                self.c.setDash(3, 3)
                self.c.line(plot_x, ref_y, plot_x + plot_w, ref_y)
                self.c.setDash()

            self.c.restoreState()
        return y - self.V_GAP

    # ------------------------------------------------------------------
    # Capa e Sumário Dinâmico
    # ------------------------------------------------------------------
    def add_report_cover(self):
        self._begin_page(motifs=True, logo=False)
        self._draw_logo(self.X, self.H - 48, 165)
        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(1.05)
        self.c.line(self.X, self.H - 267, self.X + 64, self.H - 267)
        self.c.setFillColor(self.theme.green)
        self.c.setFont(self.fonts.display, 36)
        self.c.drawString(self.X, self.H - 338, self.t["cover_title"])
        self.c.setFont(self.fonts.display_regular, 29)
        self.c.drawString(self.X, self.H - 379, self.t["cover_subtitle"])
        self._paragraph(
            self.t["cover_desc"],
            self.X, self.H - 407, 337,
            font=self.fonts.body, size=12.7, leading=17.0, color=self.theme.navy,
        )
        self._section_note(self.t["cover_note"], 165)
        self._footer("")
        self.c.showPage()

    def add_report_toc(self, dynamic_pages: dict[str, str]):
        """Sumário 100% dinâmico e uniforme de 12 seções principais."""
        sec = self.t["sections"]
        p = dynamic_pages
        items = [
            TocItem("01", sec["01"], p.get("01", "03")),
            TocItem("02", sec["02"], p.get("02", "04")),
            TocItem("03", sec["03"], p.get("03", "05")),
            TocItem("04", sec["04"], p.get("04", "06")),
            TocItem("05", sec["05"], p.get("05", "07-09")),
            TocItem("06", sec["06"], p.get("06", "10")),
            TocItem("07", sec["07"], p.get("07", "11")),
            TocItem("08", sec["08"], p.get("08", "12")),
            TocItem("09", sec["09"], p.get("09", "13")),
            TocItem("10", sec["10"], p.get("10", "14")),
            TocItem("11", sec["11"], p.get("11", "15")),
            TocItem("12", sec["12"], p.get("12", "16")),
        ]
        self._begin_page(page_no="", motifs=True, logo=False)
        self._draw_logo(self.X, self.H - 48, 145)
        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(1.0)
        self.c.line(self.X, self.H - 185, self.X + 65, self.H - 185)
        self.c.setFillColor(self.theme.green)
        self.c.setFont(self.fonts.display, 35)
        self.c.drawString(self.X, self.H - 232, self.t["toc_title"])

        # Numeração de página no cabeçalho superior direito
        self.c.setFillColor(self.theme.purple)
        self.c.setFont(self.fonts.display, 11.5)
        self.c.drawRightString(self.RIGHT, self.H - 114, "02")

        y = self.H - 270
        num_x, line_x, text_x, page_x = 50, 98, 119, self.W - 150
        right = self.W - 128
        for item in items:
            self.c.setFillColor(self.theme.green)
            self.c.setFont(self.fonts.display, 12.4)
            self.c.drawString(num_x, y, item.number)
            self.c.setStrokeColor(self.theme.green)
            self.c.setLineWidth(0.6)
            self.c.line(line_x, y - 3, line_x, y + 14)
            self.c.setFillColor(self.theme.navy)
            self.c.setFont(self.fonts.body, 8.8)
            self.c.drawString(text_x, y + 1, item.title)
            title_w = pdfmetrics.stringWidth(item.title, self.fonts.body, 8.8)
            start = text_x + title_w + 7
            if start < page_x - 8:
                self.c.saveState()
                self.c.setStrokeColor(self.theme.navy)
                self.c.setLineWidth(0.55)
                self.c.setDash(0.7, 3.2)
                self.c.line(start, y + 3, page_x - 8, y + 3)
                self.c.restoreState()
            self.c.drawRightString(right, y + 1, item.page)
            y -= 31.0
        self._section_note(self.t["toc_note"], 100)
        self.c.showPage()

    # ------------------------------------------------------------------
    # SEÇÕES DO RELATÓRIO
    # ------------------------------------------------------------------

    # SEÇÃO 01 - Identificação
    def section_01_identification(self, page_no: str):
        self.section_pages["01"] = page_no
        y = self._page_header("01", "01", page_no)
        c3 = (self.CONTENT_W - 2*self.GAP) / 3
        c2 = (self.CONTENT_W - self.GAP) / 2

        # Normaliza gênero para inglês caso solicitado
        raw_gender = self._get("patientGender")
        if self.lang == "en":
            g_lower = raw_gender.lower()
            if "masc" in g_lower or "male" in g_lower:
                disp_gender = "Male"
            elif "fem" in g_lower:
                disp_gender = "Female"
            else:
                disp_gender = "Not informed" if "não" in g_lower or not raw_gender else raw_gender
        else:
            disp_gender = raw_gender

        y = self._row_fields(y, [
            ("patient_name", self._get("patientName"), c3, self.theme.green),
            ("age", self._get("patientAge"), c3, self.theme.purple),
            ("gender", disp_gender, c3, self.theme.green),
        ])
        y = self._row_fields(y, [
            ("guardian", self._get("responsavel"), c2, self.theme.green),
            ("app_date", self._get("date"), c2, self.theme.purple),
        ])
        y = self._row_fields(y, [
            ("psychologist", self._get("psicologoName"), c3, self.theme.green),
            ("crp", self._get("psicologoCrp"), c3, self.theme.purple),
            ("clinic", self._get("clinica"), c3, self.theme.green),
        ], h=74)

        default_batt = "Complete Battery (100% completed)" if self.lang == "en" else "Concluída (100% dos jogos realizados)"
        y = self._blank_field("battery_status", self.X, y, self.CONTENT_W,
                              val=self._get("bateriaStatus", default_batt),
                              h=62, accent=self.theme.yellow, fill=self.soft_yellow)

        jogos_texto = (
            "• Goalkeeper (Visuomotor Reaction Time)\n• Tap Fast (Go/No-Go Inhibitory Control)\n• Forest Photographer (Sustained Attention and Fatigue)"
            if self.lang == "en" else
            "• Goleiro (Tempo de Reação Visomotor)\n• Toca Rápido (Controle Inibitório Go/No-Go)\n• Fotógrafo da Floresta (Atenção Sustentada e Fadiga)"
        )
        self._auto_panel("games_performed", self.X, y, self.CONTENT_W,
                         text=jogos_texto, min_h=80, fill=self.soft_green, font_size=9.2, leading=14.0)
        self._end_page()

    # SEÇÃO 02 - Motivo da avaliação
    def section_02_reason(self, page_no: str):
        self.section_pages["02"] = page_no
        y = self._page_header("02", "02", page_no)
        y = self._auto_panel("eval_objective", self.X, y, self.CONTENT_W, text=self._get("objetivo"), min_h=120)
        y = self._auto_panel("main_complaint", self.X, y, self.CONTENT_W, text=self._get("queixa"), min_h=130)
        self._auto_panel("initial_context", self.X, y, self.CONTENT_W,
                         text=self._get("contextoInicial"), min_h=130, fill=self.soft_purple,
                         border=self.purple_border, accent=self.theme.purple)
        self._end_page()

    # SEÇÃO 03 - Metodologia
    def section_03_methodology(self, page_no: str):
        self.section_pages["03"] = page_no
        y = self._page_header("03", "03", page_no)
        
        banner_h = 72.0
        self._card(self.X, y - banner_h, self.CONTENT_W, banner_h, fill=self.soft_green, border=self.card_border)
        intro_method = (
            "<b>Neuropsychological Assessment Based on Digital Biomarkers</b><br/>"
            "The Teko methodology combines structured computerized tasks with continuous registration of visuomotor interaction. "
            "By replacing paper tests with adaptive games, the child's natural behavior is captured in real time with millisecond precision."
            if self.lang == "en" else
            "<b>Avaliação Neuropsicológica Baseada em Biomarcadores Digitais</b><br/>"
            "A metodologia Teko combina tarefas computadorizadas estruturadas com registro contínuo da interação visomotora. "
            "Ao substituir testes em papel por jogos adaptativos, avalia-se o comportamento natural da criança em tempo real com alta precisão milimétrica."
        )
        self._paragraph(intro_method, self.X + 16, y - 16, self.CONTENT_W - 32,
                        font=self.fonts.body, size=8.8, leading=13.0, color=self.theme.navy)
        y -= banner_h + self.V_GAP

        y = self._auto_panel("methodology_desc", self.X, y, self.CONTENT_W,
                             text=self._get("descricaoMetodologica"), min_h=155)
        self._auto_panel("session_conditions", self.X, y, self.CONTENT_W,
                         text=self._get("condicoesSessao"), min_h=130,
                         fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    # SEÇÃO 04 - Variáveis do modelo
    def section_04_variables(self, page_no: str):
        self.section_pages["04"] = page_no
        y = self._page_header("04", "04", page_no)

        if self.lang == "en":
            expl_vtr = "Measures millisecond-level regularity of motor responses to rapid visual stimuli in the Goalkeeper game."
            expl_imp = "Evaluates motor braking and deceleration capability during high-speed No-Go stimuli in the Tap Fast game."
            expl_qa = "Assesses focus stability and perseverance over time through accuracy and lapses in Forest Photographer."
            expl_idade = "Statistical standardization and normalization of digital biomarkers according to normative peer age groups."
        else:
            expl_vtr = "Mensura a regularidade milissegundo a milissegundo das respostas motoras da criança frente a estímulos visuais rápidos no jogo do Goleiro."
            expl_imp = "Analisa a capacidade de desaceleração e freio motor diante de estímulos No-Go no jogo Toca Rápido."
            expl_qa = "Avalia a manutenção e persistência do foco ao longo do tempo através da acurácia e lapsos no Fotógrafo da Floresta."
            expl_idade = "Estandardização e normalização estatística dos biomarcadores por faixa etária da população de referência."

        y = self._auto_panel("var_vtr_title", self.X, y, self.CONTENT_W, text=expl_vtr, min_h=66, fill=self.soft_green)
        y = self._auto_panel("var_imp_title", self.X, y, self.CONTENT_W, text=expl_imp, min_h=66, fill=self.soft_purple, border=self.purple_border, accent=self.theme.purple)
        y = self._auto_panel("var_qa_title", self.X, y, self.CONTENT_W, text=expl_qa, min_h=66, fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        y = self._auto_panel("var_age_title", self.X, y, self.CONTENT_W, text=expl_idade, min_h=66, fill=self.card_fill)

        self._auto_panel("effective_variables", self.X, y, self.CONTENT_W,
                         text=self._get("variaveisEfetivas"), min_h=85, fill=self.soft_purple,
                         border=self.purple_border, accent=self.theme.purple)
        self._end_page()

    # Helpers de plotagem integral dos 3 jogos
    def _plot_goalkeeper_full(self, y: float) -> float:
        hist = self.data.get("telemetriaLongitudinal", [])
        # Filtra estritamente as sessões reais do jogo do Goleiro
        goleiro_sessions = []
        if hist and isinstance(hist, list):
            for s in hist:
                gk = str(s.get("gameKey", "")).lower()
                gn = str(s.get("gameName", "")).lower()
                if gk == "goleiro" or "goleiro" in gn:
                    goleiro_sessions.append(s)

        if goleiro_sessions:
            points = [float(s.get("vtr", 412)) for s in goleiro_sessions]
            x_labels = [str(i + 1) for i in range(len(points))]
        else:
            # Fallback caso não haja sessões filtradas
            points = [445.0, 430.0, 418.0, 412.0]
            x_labels = ["1", "2", "3", "4"]

        chart_title = "Goalkeeper Game: Visuomotor Response Time across Sessions" if self.lang == "en" else "Jogo do Goleiro: Tempo de Resposta Visomotor ao Longo das Sessões"
        x_title = "Sessions" if self.lang == "en" else "Sessões"
        y_title = "Response Time (ms)" if self.lang == "en" else "Tempo de Resposta (ms)"

        return self._draw_area_chart(
            chart_title,
            self.X, y, self.CONTENT_W, 300,
            points, unit="ms",
            x_labels=x_labels, x_axis_title=x_title, y_axis_title=y_title,
            line_color=self.theme.green, fill_color=self.soft_green
        )

    def _plot_toca_full(self, y: float) -> float:
        hist = self.data.get("telemetriaLongitudinal", [])
        # Filtra estritamente as sessões reais do jogo Toca Rápido
        toca_sessions = []
        if hist and isinstance(hist, list):
            for s in hist:
                gk = str(s.get("gameKey", "")).lower()
                gn = str(s.get("gameName", "")).lower()
                if gk == "toca_rapido" or "toca" in gn or "gonogo" in gn or "rapido" in gn:
                    toca_sessions.append(s)

        if toca_sessions:
            points = [float(s.get("imp", 4.0)) for s in toca_sessions]
            x_labels = [str(i + 1) for i in range(len(points))]
        else:
            # Fallback caso não haja sessões filtradas
            points = [6.0, 5.0, 4.0, 4.0]
            x_labels = ["1", "2", "3", "4"]

        chart_title = "Tap Fast Game: No-Go Inhibitory Commission Errors across Sessions" if self.lang == "en" else "Jogo Toca Rápido: Frequência de Erros Inibitórios No-Go ao Longo das Sessões"
        x_title = "Sessions" if self.lang == "en" else "Sessões"
        y_title = "Commission Errors (No-Go)" if self.lang == "en" else "Erros de Comissão (No-Go)"

        return self._draw_area_chart(
            chart_title,
            self.X, y, self.CONTENT_W, 300,
            points, unit=" err",
            x_labels=x_labels, x_axis_title=x_title, y_axis_title=y_title,
            line_color=self.theme.purple, fill_color=self.soft_purple
        )

    def _plot_photographer_full(self, y: float) -> float:
        hist = self.data.get("telemetriaLongitudinal", [])
        # Filtra estritamente as sessões reais do Fotógrafo da Floresta
        fotografo_sessions = []
        if hist and isinstance(hist, list):
            for s in hist:
                gk = str(s.get("gameKey", "")).lower()
                gn = str(s.get("gameName", "")).lower()
                if gk == "fotografo" or "fotó" in gn or "fotografo" in gn or "puzzle" in gn or "quebra" in gn:
                    fotografo_sessions.append(s)

        if fotografo_sessions:
            # Obtém a variação em milissegundos (ms) entre os primeiros 6 minutos e os últimos 6 minutos
            points = []
            for s in fotografo_sessions:
                val = s.get("variacao_ms", s.get("variacao", s.get("qa", 72.0)))
                try:
                    val_float = float(val)
                    # Se vier normalizado como fração (ex: 0.35), converte para ordem de grandeza em ms (ex: 35 ms)
                    if 0.0 < abs(val_float) <= 1.0:
                        val_float = val_float * 100.0
                    points.append(val_float)
                except Exception:
                    points.append(50.0)
            x_labels = [str(i + 1) for i in range(len(points))]
        else:
            # Fallback caso não haja sessões filtradas (variação real em milissegundos)
            points = [95.0, 78.0, 52.0, 38.0]
            x_labels = ["1", "2", "3", "4"]

        chart_title = "Forest Photographer: Reaction Time Shift (ms) across Sessions" if self.lang == "en" else "Fotógrafo da Floresta: Variação do Tempo de Resposta (ms) ao Longo das Sessões"
        x_title = "Sessions" if self.lang == "en" else "Sessões"
        y_title = "Latency Shift (ms)" if self.lang == "en" else "Variação de Latência (ms)"

        return self._draw_area_chart(
            chart_title,
            self.X, y, self.CONTENT_W, 300,
            points, unit=" ms",
            x_labels=x_labels, x_axis_title=x_title, y_axis_title=y_title,
            line_color=HexColor("#D97706"), fill_color=self.soft_yellow
        )

    # SEÇÃO 05 - Resultado dos jogos: Goleiro (com Síntese Clínica Rebuscada)
    def section_05_goalkeeper(self, page_no: str):
        y = self._page_header("05", "05", page_no)
        y = self._plot_goalkeeper_full(y)
        
        # Síntese Clínica e Evolutiva enriquecida e aprofundada
        if self.lang == "en":
            goleiro_text = (
                f"<b>Neurofunctional Analysis & Performance Opinion:</b><br/>"
                f"{self._get('goleiroSintese')}<br/><br/>"
                f"<b>Visuomotor Trajectory Evolution:</b> Continuous telemetry demonstrates that the child establishes early readiness and stability, "
                f"with performance variance concentrated during blocks demanding heightened temporal precision. The progressive latency reduction observed across sessions reflects "
                f"positive adaptive capacity under targeted intervention."
            )
        else:
            goleiro_text = (
                f"<b>Análise Neurofuncional e Parecer de Desempenho:</b><br/>"
                f"{self._get('goleiroSintese')}<br/><br/>"
                f"<b>Evolução da Trajetória Visomotora:</b> A telemetria contínua evidencia que a criança desenvolve prontidão e estabilidade nas fases iniciais, "
                f"com oscilação concentrada nos blocos de maior exigência temporal. A redução progressiva de latência ao longo das sessões aponta para capacidade de adaptação "
                f"positiva sob intervenção direcionada."
            )
        self._auto_panel("goleiro_synthesis", self.X, y, self.CONTENT_W,
                         text=goleiro_text, min_h=150, fill=self.soft_green)
        self._end_page()

    # SEÇÃO 05 - Resultado dos jogos: Toca Rápido (com Síntese Clínica Rebuscada)
    def section_05_toca(self, page_no: str):
        y = self._page_header("05", "05", page_no)
        y = self._plot_toca_full(y)
        
        if self.lang == "en":
            toca_text = (
                f"<b>Neurofunctional Analysis & Performance Opinion:</b><br/>"
                f"{self._get('tocaSintese')}<br/><br/>"
                f"<b>Inhibitory Control Progression:</b> Longitudinal telemetry confirms progressive reduction in impulsive taps and automatic responses, "
                f"indicating that motor inhibition mechanisms adapt satisfactorily when provided with structured slowing cues and response pacing."
            )
        else:
            toca_text = (
                f"<b>Análise Neurofuncional e Parecer de Desempenho:</b><br/>"
                f"{self._get('tocaSintese')}<br/><br/>"
                f"<b>Evolução do Controle Inibitório:</b> A análise longitudinal confirma diminuição gradativa de disparos automáticos e toques impulsivos, "
                f"indicando que o freio inibitório responde satisfatoriamente quando a criança recebe reforço estruturado de desaceleração e organização da resposta."
            )
        self._auto_panel("toca_synthesis", self.X, y, self.CONTENT_W,
                         text=toca_text, min_h=150, fill=self.soft_purple,
                         border=self.purple_border, accent=self.theme.purple)
        self._end_page()

    # SEÇÃO 05 - Resultado dos jogos: Fotógrafo da Floresta (com Síntese Clínica Rebuscada)
    def section_05_photographer(self, page_no: str):
        y = self._page_header("05", "05", page_no)
        y = self._plot_photographer_full(y)
        
        if self.lang == "en":
            fotografo_text = (
                f"<b>Neurofunctional Analysis & Performance Opinion:</b><br/>"
                f"{self._get('fotografoSintese')}<br/><br/>"
                f"<b>Attentional Endurance & Cognitive Fatigue:</b> The longitudinal trajectory highlights that sustained focus accuracy fluctuates as a function of continuous task duration, "
                f"reinforcing the clinical necessity of strategic rest intervals to optimize attentional recharging in both academic and home environments."
            )
        else:
            fotografo_text = (
                f"<b>Análise Neurofuncional e Parecer de Desempenho:</b><br/>"
                f"{self._get('fotografoSintese')}<br/><br/>"
                f"<b>Evolução da Sustentação Atencional e Fadiga:</b> A trajetória longitudinal demonstra que a taxa de acurácia sustentada oscila em função da duração contínua da atividade, "
                f"reforçando a importância clínica de intervalos estratégicos para recarga atencional no cotidiano escolar e domiciliar."
            )
        self._auto_panel("photographer_synthesis", self.X, y, self.CONTENT_W,
                         text=fotografo_text, min_h=150, fill=self.soft_yellow,
                         border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    # SEÇÃO 06 - Síntese comportamental (Layout Horizontal Absoluto em 2 Páginas Elegantes)
    def section_06_synthesis(self, page_no_start: str):
        # Página 1 da Síntese Comportamental: Variabilidade de resposta e Controle inibitório
        p1 = page_no_start
        p2_num = int(page_no_start) + 1
        p2 = f"{p2_num:02d}"

        y = self._page_header("06", "06", p1)
        y = self._auto_panel("response_variability", self.X, y, self.CONTENT_W,
                             text=self._get("variabilidade"), min_h=130, fill=self.soft_green)
        self._auto_panel("inhibitory_control", self.X, y, self.CONTENT_W,
                         text=self._get("controleInibitorio"), min_h=130, fill=self.soft_purple,
                         border=self.purple_border, accent=self.theme.purple)
        self._end_page()

        # Página 2 da Síntese Comportamental: Atenção sustentada e Interpretação conjunta
        y = self._page_header("06", "06", p2)
        y = self._auto_panel("sustained_attention", self.X, y, self.CONTENT_W,
                             text=self._get("atencaoSustentada"), min_h=130, fill=self.soft_yellow,
                             border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._auto_panel("joint_interpretation", self.X, y, self.CONTENT_W,
                         text=self._get("interpretacaoConjunta"), min_h=130, fill=self.card_fill)
        self._end_page()

    # SEÇÃO 07 - Modelo probabilístico
    def section_07_probability(self, page_no: str):
        self.section_pages["07"] = page_no
        y = self._page_header("07", "07", page_no)

        prob_val = self._get("probabilidade")
        p_style = ParagraphStyle(
            name="ProbHeroStyle",
            fontName=self.fonts.display,
            fontSize=16.0,
            leading=20.0,
            textColor=self.theme.purple,
            alignment=TA_LEFT
        )
        p_prob = Paragraph(f"<b>{prob_val}</b>", p_style)
        _, prob_text_h = p_prob.wrap(self.CONTENT_W - 36, 1000)

        hero_h = max(88.0, 44.0 + prob_text_h + 20.0)
        self._card(self.X, y - hero_h, self.CONTENT_W, hero_h, fill=self.soft_purple, border=self.purple_border, line_width=1.2)
        self.c.setFillColor(self.theme.purple)
        self.c.roundRect(self.X + 16, y - 10, 45, 3.5, 1.7, fill=1, stroke=0)
        
        prob_label = "Estimated Statistical Probability" if self.lang == "en" else "Probabilidade Estatística Estimada"
        self._draw_label(prob_label, self.X + 16, y - 18, self.CONTENT_W - 32,
                         size=9.2, color=self.theme.navy)

        p_prob.drawOn(self.c, self.X + 16, y - 38 - prob_text_h)

        date_prefix = "Assessment Date:" if self.lang == "en" else "Data da Aplicação:"
        date_text = f"{date_prefix} {self._get('date', '10/01/2026' if self.lang == 'en' else '11/10/2026')}"
        self.c.setFont(self.fonts.body_semibold, 9.0)
        self.c.setFillColor(self.muted)
        self.c.drawString(self.X + 16, y - hero_h + 12, date_text)
        y -= hero_h + self.V_GAP

        disclaimer_h = 100.0
        self._card(self.X, y - disclaimer_h, self.CONTENT_W, disclaimer_h, fill=self.soft_yellow, border=HexColor("#EBD98A"))
        
        self.c.setFillColor(HexColor("#B45309"))
        self.c.roundRect(self.X + 16, y - 10, 40, 3.5, 1.7, fill=1, stroke=0)
        ethics_label = "Technical & Ethical Interpretation Notice" if self.lang == "en" else "Nota Técnica e Ética de Interpretação"
        self._draw_label(ethics_label, self.X + 16, y - 18, self.CONTENT_W - 32,
                         size=9.2, color=self.theme.navy)

        self.c.setStrokeColor(HexColor("#EBD98A"))
        self.c.setLineWidth(0.5)
        self.c.line(self.X + 16, y - 32, self.X + self.CONTENT_W - 16, y - 32)

        if self.lang == "en":
            disclaimer_text = (
                "The reported statistical probability is derived from comparative predictive modeling based on digital "
                "telemetry biomarkers. <b>This result DOES NOT constitute a definitive medical or closed psychiatric diagnosis</b>. "
                "It serves as a standardized screening instrument that must be contextualized with qualitative clinical observations, "
                "in-person interviews, and developmental anamnesis conducted by a licensed healthcare professional."
            )
            vars_explicativas = (
                "The probabilistic model evaluates four foundational dimensions of the child's executive functioning: "
                "reaction latency variability (focus stability), impulsivity index (No-Go motor inhibition), "
                "sustained attention curve (fatigue across sequential blocks), and developmental chronological age."
            )
        else:
            disclaimer_text = (
                "A probabilidade informada decorre de modelagem probabilística comparativa fundamentada em biomarcadores "
                "digitais de telemetria. <b>Este resultado NÃO constitui diagnóstico médico fechado ou laudo psiquiátrico definitivo</b>. "
                "Trata-se de um instrumento técnico de triagem padronizado que deve obrigatoriamente ser contextualizado com a "
                "avaliação clínica qualitativa, observações comportamentais e anamnese realizada por profissional habilitado."
            )
            vars_explicativas = (
                "O cálculo probabilístico pondera quatro dimensões fundamentais do funcionamento executivo da criança: "
                "a variabilidade do tempo de reação (estabilidade do foco), o índice de impulsividade (freio motor no No-Go), "
                "a curva de sustentação atencional (fadiga ao longo dos blocos) e a faixa etária de desenvolvimento."
            )
        self._paragraph(disclaimer_text, self.X + 16, y - 42, self.CONTENT_W - 32,
                        font=self.fonts.body, size=8.8, leading=12.8, color=self.theme.navy)
        y -= disclaimer_h + self.V_GAP

        self._auto_panel("variables_used", self.X, y, self.CONTENT_W,
                         text=vars_explicativas, min_h=100, fill=self.soft_green)
        self._end_page()

    # SEÇÃO 08 - Contextualização clínica
    def section_08_context(self, page_no: str):
        self.section_pages["08"] = page_no
        y = self._page_header("08", "08", page_no)
        y = self._auto_panel("anamnese_summary", self.X, y, self.CONTENT_W,
                             text=self._get("anamneseResumo"), min_h=130)
        y = self._auto_panel("clinical_notes", self.X, y, self.CONTENT_W,
                             text=self._get("notasClinicas"), min_h=110,
                             fill=self.soft_purple, border=self.purple_border, accent=self.theme.purple)
        self._auto_panel("history_summary", self.X, y, self.CONTENT_W,
                         text=self._get("historicoSessoes"), min_h=110, fill=self.soft_green)
        self._end_page()

    # SEÇÃO 09 - Integração dos achados (Layout Horizontal Absoluto)
    def section_09_integration(self, page_no: str):
        self.section_pages["09"] = page_no
        y = self._page_header("09", "09", page_no)
        y = self._auto_panel("findings_relation", self.X, y, self.CONTENT_W,
                             text=self._get("relacao"), min_h=90)
        y = self._auto_panel("convergences", self.X, y, self.CONTENT_W,
                             text=self._get("convergencias"), min_h=80, fill=self.soft_green)
        y = self._auto_panel("divergences", self.X, y, self.CONTENT_W,
                             text=self._get("divergencias"), min_h=80, fill=self.soft_purple,
                             border=self.purple_border, accent=self.theme.purple)
        self._auto_panel("integrated_synthesis", self.X, y, self.CONTENT_W,
                         text=self._get("sinteseIntegrada"), min_h=80,
                         fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    # SEÇÃO 10 - Pontos para consideração profissional
    def section_10_considerations(self, page_no: str):
        self.section_pages["10"] = page_no
        y = self._page_header("10", "10", page_no)
        labels = [
            ("investigation_focus", self._get("consid1")),
            ("school_adaptations", self._get("consid2")),
            ("followup_reeval", self._get("consid3")),
            ("complementary_scales", self._get("consid4")),
            ("routine_sleep", self._get("consid5")),
        ]
        for i, (label_key, text_val) in enumerate(labels):
            y = self._auto_panel(
                label_key, self.X, y, self.CONTENT_W,
                text=text_val, min_h=64,
                fill=self.soft_green if i % 2 == 0 else self.card_fill,
                accent=self.theme.green if i % 2 == 0 else self.theme.purple,
                font_size=8.8, leading=12.5
            )
        self._end_page()

    # SEÇÃO 11 - Conclusão (Layout Horizontal Absoluto em 2 Páginas)
    def section_11_conclusion(self, page_no_start: str):
        p1 = page_no_start
        p2_num = int(page_no_start) + 1
        p2 = f"{p2_num:02d}"

        # Página 1 da Conclusão: Título, Resultado dos Jogos e Resultado Probabilístico
        self._begin_page(page_no="", motifs=True, logo=False)
        self._draw_logo(self.X, self.H - 58, 160)
        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(1.0)
        self.c.line(self.X, self.H - 236, self.X + 64, self.H - 236)
        self.c.setFillColor(self.theme.green)
        self.c.setFont(self.fonts.display, 36)
        self.c.drawString(self.X, self.H - 300, self.t["conclusion_title"])

        self.c.setFillColor(self.theme.purple)
        self.c.setFont(self.fonts.display, 11.5)
        self.c.drawRightString(self.RIGHT, self.H - 114, str(p1))

        y = self.H - 338
        y = self._auto_panel("games_result", self.X, y, self.CONTENT_W,
                             text=self._get("resultadoJogos"), min_h=120, fill=self.soft_green)
        self._auto_panel("probabilistic_result", self.X, y, self.CONTENT_W,
                         text=self._get("resultadoProbabilistico"), min_h=120, fill=self.soft_purple,
                         border=self.purple_border, accent=self.theme.purple)
        self.c.showPage()

        # Página 2 da Conclusão: Relação com Contexto Clínico, Ressalvas e Slogan
        y = self._page_header("11", "11", p2)
        y = self._auto_panel("clinical_relation", self.X, y, self.CONTENT_W,
                             text=self._get("relacaoClinica"), min_h=135, fill=self.soft_yellow,
                             border=HexColor("#EBD98A"), accent=self.theme.yellow)
        y = self._auto_panel("caveats", self.X, y, self.CONTENT_W,
                             text=self._get("ressalvas"), min_h=135)

        self.c.setFillColor(self.theme.navy)
        self.c.setFont(self.fonts.body, 13.2)
        self.c.drawString(self.X, 154, self.t["slogan"])
        self.c.setStrokeColor(self.theme.green)
        self.c.line(self.X, 137, self.X + 57, 137)
        self.c.showPage()

    # SEÇÃO 12 - Assinatura e rastreabilidade
    def section_12_traceability(self, page_no: str):
        self.section_pages["12"] = page_no
        y = self._page_header("12", "12", page_no)
        c2 = (self.CONTENT_W - self.GAP) / 2

        y = self._row_fields(y, [
            ("psychologist", self._get("psicologoName"), c2, self.theme.green),
            ("crp", self._get("psicologoCrp"), c2, self.theme.purple),
        ])
        y = self._row_fields(y, [
            ("generation_date", self._get("date"), c2, self.theme.green),
            ("report_id", self._get("reportId"), c2, self.theme.purple),
        ])
        y = self._blank_field("doc_hash", self.X, y, self.CONTENT_W,
                              val=self._get("hash"), h=64, accent=self.theme.green)

        validacao_texto = (
            f"Clinical report electronically generated under professional responsibility of "
            f"<b>{self._get('psicologoName')} ({self._get('psicologoCrp')})</b> on {self._get('date')}. "
            f"The cryptographic hash above certifies telemetry and assessment data integrity."
            if self.lang == "en" else
            f"Relatório clínico gerado eletronicamente sob responsabilidade técnica de "
            f"<b>{self._get('psicologoName')} ({self._get('psicologoCrp')})</b> na data de {self._get('date')}. "
            f"O hash criptográfico acima garante a integridade dos dados telemétricos e do laudo emitido."
        )
        self._auto_panel("traceability_validity", self.X, y, self.CONTENT_W,
                         text=validacao_texto, min_h=100, fill=self.soft_green)
        self._end_page()

    def build(self):
        # Mapeamento dinâmico harmonizado de 18 páginas totais:
        # Pág 01: Capa
        # Pág 02: Sumário
        # Pág 03: 01. Identificação
        # Pág 04: 02. Motivo da avaliação
        # Pág 05: 03. Metodologia
        # Pág 06: 04. Variáveis do modelo
        # Pág 07-09: 05. Resultado dos jogos (07 Goleiro, 08 Toca Rápido, 09 Fotógrafo)
        # Pág 10-11: 06. Síntese comportamental (10 Variabilidade/Inibição, 11 Atenção/Conjunta)
        # Pág 12: 07. Modelo probabilístico
        # Pág 13: 08. Contextualização clínica
        # Pág 14: 09. Integração dos achados
        # Pág 15: 10. Pontos para consideração profissional
        # Pág 16-17: 11. Conclusão (16 Jogos/Probabilístico, 17 Contexto/Ressalvas)
        # Pág 18: 12. Assinatura e rastreabilidade
        dynamic_pages = {
            "01": "03",
            "02": "04",
            "03": "05",
            "04": "06",
            "05": "07-09",
            "06": "10-11",
            "07": "12",
            "08": "13",
            "09": "14",
            "10": "15",
            "11": "16-17",
            "12": "18",
        }
        self.section_pages = dynamic_pages

        self.add_report_cover()
        self.add_report_toc(dynamic_pages)
        self.section_01_identification(page_no=dynamic_pages["01"])
        self.section_02_reason(page_no=dynamic_pages["02"])
        self.section_03_methodology(page_no=dynamic_pages["03"])
        self.section_04_variables(page_no=dynamic_pages["04"])
        self.section_05_goalkeeper(page_no="07")
        self.section_05_toca(page_no="08")
        self.section_05_photographer(page_no="09")
        self.section_06_synthesis(page_no_start="10")
        self.section_07_probability(page_no=dynamic_pages["07"])
        self.section_08_context(page_no=dynamic_pages["08"])
        self.section_09_integration(page_no=dynamic_pages["09"])
        self.section_10_considerations(page_no=dynamic_pages["10"])
        self.section_11_conclusion(page_no_start="16")
        self.section_12_traceability(page_no=dynamic_pages["12"])
        return self.save()


def build_report(output: str | Path, data: dict | None = None, asset_dir: str | Path | None = None, mock: bool = True) -> Path:
    return TekoFinalReportPDF(output, data=data, asset_dir=asset_dir, mock=mock).build()


if __name__ == "__main__":
    import argparse
    import json
    parser = argparse.ArgumentParser(description="Generate Teko standardized final report PDF (Bilingual PT/EN).")
    parser.add_argument("--output", default="Teko_Relatorio_Final_Totalmente_Preenchido.pdf")
    parser.add_argument("--data", default=None, help="JSON string or path to JSON file with report fields")
    parser.add_argument("--asset-dir", default=None, help="Optional assets folder.")
    parser.add_argument("--lang", default="pt", choices=["pt", "en"], help="Language for PDF output")
    args = parser.parse_args()

    input_data = {}
    if args.data:
        if Path(args.data).exists():
            with open(args.data, "r", encoding="utf-8") as f:
                input_data = json.load(f)
        else:
            try:
                input_data = json.loads(args.data)
            except Exception:
                pass

    use_mock = True if not input_data else False
    if "lang" not in input_data and args.lang:
        input_data["lang"] = args.lang

    print(build_report(args.output, data=input_data, asset_dir=args.asset_dir, mock=use_mock))
