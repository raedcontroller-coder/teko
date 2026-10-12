from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Sequence

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from teko_pdf_system_assets import TekoPDF, TocItem


TRANSLATIONS = {
    "pt": {
        "footer_label": "ANAMNESE",
        "section_prefix": "ANAMNESE  •  SEÇÃO",
        "section_cont": "(Continuação)",
        "slogan": "Compreender para cuidar.",
        "cover_title": "Anamnese",
        "cover_subtitle": "Clínica Infantil",
        "cover_desc": "Estrutura clínica padronizada para registro integral do histórico de desenvolvimento, marcos psicomotores, rotina e contexto psicossocial.",
        "cover_note": "Documento clínico de levantamento histórico estruturado Teko.",
        "patient": "Nome do paciente",
        "age": "Idade",
        "gender": "Gênero",
        "guardian": "Responsável",
        "evaluator": "Psicólogo(a) responsável",
        "crp": "Registro profissional (CRP)",
        "clinic": "Clínica / Instituição",
        "record": "Registro de prontuário",
        "assessment_date": "Data da avaliação",
        "ident_card_title": "IDENTIFICAÇÃO GERAL DO PACIENTE E PROFISSIONAL",
        "toc_title": "Sumário",
        "toc_desc": "Estrutura clínica organizada por etapas do desenvolvimento infantil, rotina e contexto psicossocial.",
        "conclusion_title": "Conclusão",
        "conclusion_subtitle": "Síntese e Parecer da Anamnese",
        "conclusion_p1": "A presente anamnese reúne informações clínicas essenciais para a compreensão global do desenvolvimento, marcos maturacionais, saúde, rotina, dinâmica sociofamiliar e histórico escolar da criança.",
        "conclusion_p2": "Este registro padronizado fornece subsídio técnico e fundamentação ética para contextualizar o rastreamento neuropsicológico, orientar intervenções pedagógicas e guiar condutas clínicas individualizadas ao longo do acompanhamento.",
        "conclusion_footer": "Documento técnico estruturado para apoiar o registro clínico e a tomada de decisão profissional.",
        "auth_title": "Autenticidade e Responsabilidade Profissional",
        "yes": "Sim",
        "no": "Não",
        "sections": {
            "01": {
                "title": "Motivo da Consulta",
                "s01_queixa_historico": "Queixa principal e histórico detalhado do problema"
            },
            "02": {
                "title": "Gestação e Pré-Natal",
                "s02_gestacao_planejada": "A gestação foi planejada/desejada?",
                "s02_prenatal": "Fez acompanhamento pré-natal?",
                "s02_idade_mae": "Idade da mãe na gestação",
                "s02_idade_pai": "Idade do pai na gestação",
                "s02_complicacoes": "Complicações durante a gestação e intercorrências"
            },
            "03": {
                "title": "Parto e Nascimento",
                "s03_tipo_parto": "Tipo de parto",
                "s03_chorou": "Chorou logo ao nascer?",
                "s03_uti": "Necessitou de UTI neonatal?",
                "s03_ictericia": "Apresentou icterícia (amarelão)?",
                "s03_peso": "Peso ao nascer (kg)",
                "s03_altura": "Altura ao nascer (cm)"
            },
            "04": {
                "title": "Desenvolvimento Psicomotor",
                "subtitle": "Idade em meses para marcos do neurodesenvolvimento",
                "s04_cabeca": "Sustentou a cabeça / Sentou",
                "s04_palavras": "Primeiras palavras",
                "s04_engatinhar_andar": "Engatinhou / Andou",
                "s04_desfralde": "Desfralde (diurno/noturno)",
                "s04_tiques": "Apresenta tiques, manias ou estereotipias?"
            },
            "05": {
                "title": "Sono e Alimentação",
                "s05_alimentacao_infancia": "Alimentação na primeira infância",
                "s05_alimentacao_atual": "Padrão de alimentação atual",
                "s05_sono_tranquilo": "O sono é tranquilo e reparador?",
                "s05_horas_sono": "Média de horas de sono por noite",
                "s05_dorme_sozinho": "Dorme sozinho no próprio quarto?",
                "s05_disturbios_sono": "Distúrbios de sono e agitação noturna observados"
            },
            "06": {
                "title": "Sexualidade e Curiosidade",
                "s06_curiosidade": "Apresenta curiosidade sexual natural para a idade?",
                "s06_masturbacao": "Manipulação de órgãos genitais (masturbação)?",
                "s06_orientacao": "Já recebeu orientação e diálogo em casa?",
                "s06_relatos": "Observações e relatos de comportamento sexual"
            },
            "07": {
                "title": "História Médica e Saúde",
                "s07_doencas": "Doenças anteriores, respiratórias ou crônicas",
                "s07_traumatismo": "Já sofreu traumatismo craniano ou quedas graves?",
                "s07_enxaqueca": "Sofre de enxaqueca ou dores de cabeça frequentes?",
                "s07_convulsoes": "Já teve convulsões, febre alta ou desmaios?",
                "s07_detalhamentos": "Detalhamentos médicos, cirurgias ou internações"
            },
            "08": {
                "title": "Ambiente Familiar e Social",
                "s08_conjugal": "Situação conjugal e dinâmica dos pais",
                "s08_parentes": "Detalhamento do relacionamento com parentes e irmãos",
                "s08_interacao": "Interação social com pares (colegas e amigos)"
            },
            "09": {
                "title": "Escolaridade e Aprendizagem",
                "s09_gosta_escola": "Apresenta boa motivação para ir à escola?",
                "s09_dificuldades": "Dificuldades escolares observadas em sala de aula",
                "s09_historico": "Histórico pedagógico, comportamento em sala e rendimento"
            },
            "10": {
                "title": "Tratamentos Anteriores e Medicação",
                "s10_tratamentos": "Histórico de terapia, fonoaudiologia ou psicopedagogia",
                "s10_medicacao_continua": "Faz uso contínuo de medicação prescrita?",
                "s10_nome_posologia": "Nome da medicação, posologia e acompanhamento"
            },
            "11": {
                "title": "Observações Finais e Conduta",
                "s11_impressao": "Impressão diagnóstica preliminar e parecer clínico",
                "s11_plano": "Plano de intervenção, encaminhamentos e orientações"
            }
        }
    },
    "en": {
        "footer_label": "ANAMNESIS",
        "section_prefix": "ANAMNESIS  •  SECTION",
        "section_cont": "(Continuation)",
        "slogan": "Understanding to care.",
        "cover_title": "Anamnesis",
        "cover_subtitle": "Child Clinical Record",
        "cover_desc": "Standardized clinical framework for recording developmental history, psychomotor milestones, daily routine, and psychosocial context.",
        "cover_note": "Teko standardized clinical history assessment document.",
        "patient": "Patient's Name",
        "age": "Age",
        "gender": "Gender",
        "guardian": "Guardian",
        "evaluator": "Responsible Psychologist",
        "crp": "Professional License (CRP)",
        "clinic": "Clinic / Institution",
        "record": "Medical Record Date",
        "assessment_date": "Assessment Date",
        "ident_card_title": "PATIENT & PROFESSIONAL IDENTIFICATION",
        "toc_title": "Table of Contents",
        "toc_desc": "Clinical structure organized by child developmental stages, routine, and psychosocial context.",
        "conclusion_title": "Conclusion",
        "conclusion_subtitle": "Clinical Synthesis & Conduct",
        "conclusion_p1": "This clinical anamnesis brings together essential information to understand the child's holistic development, maturational milestones, physical health, daily routine, family dynamics, and educational background.",
        "conclusion_p2": "This standardized document provides empirical foundation and ethical alignment to contextualize neuropsychological telemetry screening, inform pedagogical strategies, and guide individualized care throughout clinical monitoring.",
        "conclusion_footer": "Structured clinical document to support professional records and therapeutic decision-making.",
        "auth_title": "Authenticity & Professional Responsibility",
        "yes": "Yes",
        "no": "No",
        "sections": {
            "01": {
                "title": "Reason for Consultation",
                "s01_queixa_historico": "Main complaint and detailed problem history"
            },
            "02": {
                "title": "Pregnancy & Prenatal Care",
                "s02_gestacao_planejada": "Was the pregnancy planned/desired?",
                "s02_prenatal": "Did the mother receive prenatal care?",
                "s02_idade_mae": "Mother's age during pregnancy",
                "s02_idade_pai": "Father's age during pregnancy",
                "s02_complicacoes": "Complications and occurrences during pregnancy"
            },
            "03": {
                "title": "Childbirth & Birth",
                "s03_tipo_parto": "Type of delivery",
                "s03_chorou": "Cried immediately at birth?",
                "s03_uti": "Required neonatal ICU admission?",
                "s03_ictericia": "Presented jaundice at birth?",
                "s03_peso": "Birth weight (kg)",
                "s03_altura": "Birth height (cm)"
            },
            "04": {
                "title": "Psychomotor Development",
                "subtitle": "Age in months for developmental milestones",
                "s04_cabeca": "Head control / Sitting unassisted",
                "s04_palavras": "First words spoken",
                "s04_engatinhar_andar": "Crawling / Walking",
                "s04_desfralde": "Toilet training (daytime/nighttime)",
                "s04_tiques": "Presented motor tics, habits or stereotypies?"
            },
            "05": {
                "title": "Sleep & Nutrition",
                "s05_alimentacao_infancia": "Early childhood feeding pattern",
                "s05_alimentacao_atual": "Current nutrition and eating habits",
                "s05_sono_tranquilo": "Is sleep peaceful and restorative?",
                "s05_horas_sono": "Average sleep hours per night",
                "s05_dorme_sozinho": "Sleeps alone in their own bedroom?",
                "s05_disturbios_sono": "Observed sleep disturbances and nocturnal restlessness"
            },
            "06": {
                "title": "Sexuality & Curiosity",
                "s06_curiosidade": "Natural sexual curiosity consistent with age?",
                "s06_masturbacao": "Genital manipulation (masturbation)?",
                "s06_orientacao": "Received parental guidance at home?",
                "s06_relatos": "Observations and reports regarding sexual behavior"
            },
            "07": {
                "title": "Medical History & Health",
                "s07_doencas": "Previous medical conditions, respiratory or chronic",
                "s07_traumatismo": "Suffered head trauma or severe falls?",
                "s07_enxaqueca": "Suffers from migraines or recurrent headaches?",
                "s07_convulsoes": "Ever experienced seizures, high fever or fainting?",
                "s07_detalhamentos": "Medical details, surgical procedures or hospitalizations"
            },
            "08": {
                "title": "Family & Social Environment",
                "s08_conjugal": "Parents' marital status and co-parenting dynamic",
                "s08_parentes": "Relationship details with relatives and siblings",
                "s08_interacao": "Social interaction with peers (classmates and friends)"
            },
            "09": {
                "title": "Schooling & Learning",
                "s09_gosta_escola": "Shows enthusiasm and motivation to attend school?",
                "s09_dificuldades": "School difficulties observed in the classroom",
                "s09_historico": "Academic history, classroom behavior, and learning pace"
            },
            "10": {
                "title": "Previous Treatments & Medication",
                "s10_tratamentos": "History of psychotherapy, speech or psychopedagogy therapy",
                "s10_medicacao_continua": "Currently uses continuous prescribed medication?",
                "s10_nome_posologia": "Medication name, dosage, and medical monitoring"
            },
            "11": {
                "title": "Final Observations & Conduct",
                "s11_impressao": "Preliminary diagnostic impression and clinical synthesis",
                "s11_plano": "Intervention plan, referrals, and clinical guidelines"
            }
        }
    }
}


class TekoAnamnesePDF(TekoPDF):
    """Template elegante e padronizado da Anamnese Teko, harmonizado com as cores, fontes e sumário do Relatório Final."""

    X = 47.0
    RIGHT = 459.0
    CONTENT_W = 412.0
    GAP = 12.0
    V_GAP = 14.0
    FIELD_H = 68.0
    HEADER_H = 30.0

    def __init__(self, output_path: str | Path, data: dict | None = None, asset_dir: str | Path | None = None):
        if asset_dir:
            root = Path(asset_dir)
        else:
            primary_assets = Path(__file__).resolve().parent / "assets"
            fallback_assets = Path(__file__).resolve().parent / "assets_anamnese"
            root = primary_assets if primary_assets.exists() else fallback_assets

        self.data = data or {}
        lang_input = str(self.data.get("lang", "pt")).lower()
        self.lang = "en" if lang_input.startswith("en") else "pt"
        self.t = TRANSLATIONS[self.lang]

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

        # Paleta Harmoniosa idêntica ao Relatório Final Ouro
        self.card_fill = HexColor("#FFFDF9")
        self.card_border = HexColor("#BCD6D0")
        self.purple_border = HexColor("#C9BCEB")
        self.soft_green = HexColor("#EAF4F1")
        self.soft_purple = HexColor("#F2EEFB")
        self.soft_yellow = HexColor("#FFF7D9")
        self.muted = HexColor("#687384")
        self.grid = HexColor("#D7E4E1")

        self.section_pages: dict[str, str] = {}

    def _get_val(self, name: str) -> str:
        """Busca valor nos aliases garantindo tradução de booleanos e listas formatadas."""
        aliases = {
            "s01_queixa_historico": ["queixa", "queixa_historico", "s01_queixa_historico"],
            "s02_gestacao_planejada": ["desejada", "gestacao_planejada", "s02_gestacao_planejada"],
            "s02_prenatal": ["prenatal", "s02_prenatal"],
            "s02_idade_mae": ["idadeMae", "idade_mae", "s02_idade_mae"],
            "s02_idade_pai": ["idadePai", "idade_pai", "s02_idade_pai"],
            "s02_complicacoes": ["doencasGestacao", "complGestacao", "complicacoes", "s02_complicacoes"],
            "s03_tipo_parto": ["tipoParto", "tipo_parto", "s03_tipo_parto"],
            "s03_chorou": ["chorouAoNascer", "chorou", "s03_chorou"],
            "s03_uti": ["uti", "s03_uti"],
            "s03_ictericia": ["ictericia", "s03_ictericia"],
            "s03_peso": ["pesoNascer", "peso", "s03_peso"],
            "s03_altura": ["alturaNascer", "altura", "s03_altura"],
            "s04_cabeca": ["sentar", "sustentouCabeca", "cabeca", "s04_cabeca"],
            "s04_palavras": ["primeirasPalavras", "palavras", "s04_palavras"],
            "s04_engatinhar_andar": ["andar", "engatinharAndar", "engatinhar_andar", "s04_engatinhar_andar"],
            "s04_desfralde": ["desfralde", "s04_desfralde"],
            "s04_tiques": ["tiques", "s04_tiques"],
            "s05_alimentacao_infancia": ["alimentacaoInfancia", "alimentacao_infancia", "s05_alimentacao_infancia"],
            "s05_alimentacao_atual": ["alimentacaoAtual", "alimentacao_atual", "s05_alimentacao_atual"],
            "s05_sono_tranquilo": ["sonoTranquilo", "sono_tranquilo", "s05_sono_tranquilo"],
            "s05_horas_sono": ["horasSono", "horas_sono", "s05_horas_sono"],
            "s05_dorme_sozinho": ["dormeSozinho", "dorme_sozinho", "s05_dorme_sozinho"],
            "s05_disturbios_sono": ["disturbiosSono", "disturbios_sono", "s05_disturbios_sono"],
            "s06_curiosidade": ["curiosidadeSexual", "curiosidade", "s06_curiosidade"],
            "s06_masturbacao": ["manipulacao", "manipulacaoGenitais", "masturbacao", "s06_masturbacao"],
            "s06_orientacao": ["orientacaoSexual", "orientacaoEmCasa", "orientacao", "s06_orientacao"],
            "s06_relatos": ["relatosSex", "relatosObservados", "relatos", "s06_relatos"],
            "s07_doencas": ["doencasAnteriores", "doencas", "s07_doencas"],
            "s07_traumatismo": ["traumatismo", "traumatismoCraniano", "s07_traumatismo"],
            "s07_enxaqueca": ["enxaqueca", "enxaquecaDores", "s07_enxaqueca"],
            "s07_convulsoes": ["convulsao", "convulsoesDesmaios", "convulsoes", "s07_convulsoes"],
            "s07_detalhamentos": ["detalhesMedicos", "detalhamentosDoencas", "detalhamentos", "s07_detalhamentos"],
            "s08_conjugal": ["situacaoPais", "situacaoConjugal", "conjugal", "s08_conjugal"],
            "s08_parentes": ["relacionamentos", "relacionamentoParentes", "parentes", "s08_parentes"],
            "s08_interacao": ["interacaoSocial", "interacaoPares", "interacao", "s08_interacao"],
            "s09_gosta_escola": ["gostaEscola", "gosta_escola", "s09_gosta_escola"],
            "s09_dificuldades": ["dificuldadeEscolar", "dificuldadesEscolares", "dificuldades", "s09_dificuldades"],
            "s09_historico": ["historicoEscolar", "historico", "s09_historico"],
            "s10_tratamentos": ["tratamentos", "tratamentosAnteriores", "s10_tratamentos"],
            "s10_medicacao_continua": ["usoMedicacao", "medicacaoContinua", "medicacao_continua", "s10_medicacao_continua"],
            "s10_nome_posologia": ["medicacoes", "nomePosologia", "nome_posologia", "s10_nome_posologia"],
            "s11_impressao": ["impressaoGeral", "impressaoClinica", "impressao", "s11_impressao"],
            "s11_plano": ["planoIntervencao", "plano", "s11_plano"],
        }
        search_keys = aliases.get(name, [name])
        for key in search_keys:
            if key in self.data and self.data[key] is not None:
                val = self.data[key]
                if isinstance(val, bool):
                    return self.t["yes"] if val else self.t["no"]
                if isinstance(val, list):
                    formatted_list = ", ".join([str(x) for x in val if x is not None and str(x).strip() != ""]).strip()
                    if formatted_list:
                        return formatted_list
                    continue
                str_val = str(val).strip()
                if str_val != "":
                    # Tradução automática de valores booleanos textuais em inglês
                    if self.lang == "en":
                        if str_val.lower() == "sim": return "Yes"
                        if str_val.lower() == "não" or str_val.lower() == "nao": return "No"
                    return str_val
        return "—"

    def _get_guardian(self) -> str:
        for k in ["responsavel", "guardianName", "guardian", "nomeResponsavel", "parentName"]:
            val = self.data.get(k)
            if val and str(val).strip() and str(val).strip() != "—":
                return str(val).strip()
        return "Legal Guardian" if self.lang == "en" else "Responsável Legal"

    def _footer(self, page_no: str) -> None:
        self.c.saveState()
        self.c.setFillColor(self.theme.muted)
        self.c.setFont(self.fonts.body, 8)
        self.c.drawString(45, 30, f"TEKO  •  2026  •  {self.footer_label}")
        self.c.restoreState()

    def _draw_asset_right(self, path: Path, y: float, width: float, top_anchor: bool = False, overscan: float = 0):
        if not path.exists(): return
        im = ImageReader(str(path))
        iw, ih = im.getSize()
        h = width * ih / iw
        x = self.W - width + overscan
        draw_y = y - h if top_anchor else y
        self.c.drawImage(im, x, draw_y, width=width, height=h, preserveAspectRatio=True, mask="auto")

    def _corner_motifs(self, *, bottom_leaves: bool = True) -> None:
        if self.top_corner_asset and self.top_corner_asset.exists():
            self._draw_asset_right(self.top_corner_asset, self.H + 4, width=198, top_anchor=True, overscan=8)
        if bottom_leaves and self.bottom_corner_asset and self.bottom_corner_asset.exists():
            self._draw_asset_right(self.bottom_corner_asset, -4, width=213, top_anchor=False, overscan=10)

    def _draw_logo(self, x: float, y_top: float, width: float = 160) -> None:
        if self.logo_path and self.logo_path.exists():
            im = ImageReader(str(self.logo_path))
            iw, ih = im.getSize()
            h = width * ih / iw
            self.c.drawImage(im, x, y_top - h, width=width, height=h, preserveAspectRatio=True, mask="auto")

    def _wrap(self, text: str, font: str, size: float, max_width: float, max_lines: int = 2) -> list[str]:
        words = text.replace("<br/>", "\n").replace("<br>", "\n").split()
        if not words: return []
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
        if len(lines) <= max_lines: return lines
        if size > 6.0: return self._wrap(text, font, size - 0.2, max_width, max_lines)
        return lines[:max_lines]

    def _draw_label(self, text: str, x: float, y_top: float, w: float, *, size: float = 7.8, color: Color | None = None, max_lines: int = 2) -> float:
        """Desenha rótulo com quebra suave e retorna o offset vertical do fim do texto em relação a y_top."""
        font = self.fonts.body_semibold
        current_size = size
        while current_size > 6.0:
            lines = self._wrap(text, font, current_size, w, max_lines)
            if len(lines) <= max_lines: break
            current_size -= 0.2
        self.c.setFillColor(color or self.theme.green)
        self.c.setFont(font, current_size)
        start_y = y_top - 12.0
        yy = start_y - current_size
        for line in lines[:max_lines]:
            self.c.drawString(x, yy, line)
            yy -= current_size + 1.8
        bottom_offset = (y_top - yy) - 1.8 + (0.2 * current_size)
        return bottom_offset

    def _page_header(self, index: str, page_no: str) -> float:
        sec_title = self.t["sections"][index]["title"]
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

        # Numeração de página no cabeçalho superior direito
        self.c.setFillColor(self.theme.purple)
        self.c.setFont(self.fonts.display, 11.5)
        self.c.drawRightString(self.RIGHT, self.H - 114, str(page_no))
        return self.H - 180

    def _end_page(self):
        self.c.showPage()

    def _card(self, x: float, y: float, w: float, h: float, *, fill: Color | None = None, border: Color | None = None, radius: float = 8.5, line_width: float = 0.75):
        self.c.saveState()
        self.c.setFillColor(fill or self.card_fill)
        self.c.setStrokeColor(border or self.card_border)
        self.c.setLineWidth(line_width)
        self.c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
        self.c.restoreState()

    def _blank_field(self, label_text: str, x: float, y_top: float, w: float, *, val: str = "", h: float | None = None,
                     accent: Color | None = None, fill: Color | None = None, custom_sep_offset: float | None = None) -> float:
        h = h or self.FIELD_H
        y = y_top - h
        self._card(x, y, w, h, fill=fill)
        accent = accent or self.theme.green
        self.c.setFillColor(accent)
        self.c.roundRect(x + 14, y_top - 9.0, 34, 3.2, 1.6, fill=1, stroke=0)
        
        # Desenha rótulo com respiro adequado
        bottom_offset = self._draw_label(label_text, x + 14, y_top, w - 28, size=7.8, color=self.muted, max_lines=2)
        
        # Posição da linha separadora: sempre abaixo do rótulo, nunca interceptando texto
        sep_offset = custom_sep_offset if custom_sep_offset is not None else max(self.HEADER_H, bottom_offset + 5.0)
        sep_y = y_top - sep_offset
        self.c.setStrokeColor(self.grid)
        self.c.setLineWidth(0.45)
        self.c.line(x + 14, sep_y, x + w - 14, sep_y)

        val_text = val if (val and val != "—") else "—"
        clean_val = val_text.replace("\n", " ").strip()
        self._paragraph(clean_val, x + 14, sep_y - 5.0, w - 28,
                        font=self.fonts.body_semibold if (clean_val != "—" and len(clean_val) < 30) else self.fonts.body,
                        size=9.0, leading=12.0, color=self.theme.navy if clean_val != "—" else self.muted)
        return y - self.V_GAP

    def _auto_panel(self, label_text: str, x: float, y_top: float, w: float, *, text: str = "", min_h: float = 75.0,
                    fill: Color | None = None, border: Color | None = None, accent: Color | None = None,
                    font_size: float = 9.2, leading: float = 13.5) -> float:
        clean_text = (text or "—").replace("\n", "<br/>")
        style = ParagraphStyle(
            name=f"AnamAuto_{abs(hash(label_text))}_{abs(hash(clean_text[:40]))}",
            fontName=self.fonts.body,
            fontSize=font_size,
            leading=leading,
            textColor=self.theme.navy,
            alignment=TA_LEFT,
        )
        inner_padding = 16.0
        inner_w = w - (2 * inner_padding)
        p = Paragraph(clean_text, style)
        _, text_h = p.wrap(inner_w, 2000.0)

        header_space = 40.0
        bottom_pad = 16.0
        calc_h = max(min_h, header_space + text_h + bottom_pad)

        y = y_top - calc_h
        self._card(x, y, w, calc_h, fill=fill, border=border)
        accent = accent or self.theme.green
        self.c.setFillColor(accent)
        self.c.roundRect(x + inner_padding, y_top - 10, 42, 3.5, 1.7, fill=1, stroke=0)
        self._draw_label(label_text, x + inner_padding, y_top - 6, inner_w, size=8.8, color=self.theme.navy, max_lines=2)

        sep_y = y_top - 34.0
        self.c.setStrokeColor(border or self.card_border)
        self.c.setLineWidth(0.5)
        self.c.line(x + inner_padding, sep_y, x + w - inner_padding, sep_y)

        p.drawOn(self.c, x + inner_padding, sep_y - 8.0 - text_h)
        return y - self.V_GAP

    def _row_fields(self, y_top: float, specs: Sequence[tuple[str, str, float, Color | None]], *, h: float | None = None) -> float:
        font = self.fonts.body_semibold
        max_sep = self.HEADER_H
        for label_text, _, width, _ in specs:
            w_avail = width - 28.0
            cur_sz = 7.8
            while cur_sz > 6.0:
                lines = self._wrap(label_text, font, cur_sz, w_avail, 2)
                if len(lines) <= 2: break
                cur_sz -= 0.2
            if len(lines) <= 1:
                b_offset = 12.0 + cur_sz + 0.2 * cur_sz
            else:
                b_offset = 12.0 + 2 * cur_sz + 1.8 + 0.2 * cur_sz
            sep = max(self.HEADER_H, b_offset + 5.0)
            if sep > max_sep:
                max_sep = sep

        h = h or max(self.FIELD_H, max_sep + 34.0)
        x = self.X
        for label_text, val, width, accent in specs:
            self._blank_field(label_text, x, y_top, width, val=val, h=h, accent=accent, custom_sep_offset=max_sep)
            x += width + self.GAP
        return y_top - h - self.V_GAP

    # ------------------------------------------------------------------
    # Páginas Estruturais (Capa e Sumário Dinâmico)
    # ------------------------------------------------------------------
    def add_anamnese_cover(self):
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

        # Identificação na capa estilizada
        c3 = (self.CONTENT_W - 2*self.GAP) / 3
        c2 = (self.CONTENT_W - self.GAP) / 2
        y = self.H - 490

        # Normaliza gênero
        raw_gender = self.data.get("patientGender") or self.data.get("gender") or "—"
        if self.lang == "en":
            if "masc" in raw_gender.lower() or "male" in raw_gender.lower(): disp_gender = "Male"
            elif "fem" in raw_gender.lower(): disp_gender = "Female"
            else: disp_gender = raw_gender
        else:
            disp_gender = raw_gender

        y = self.H - 482
        y = self._row_fields(y, [
            (self.t["patient"], str(self.data.get("patientName") or "—"), c3, self.theme.green),
            (self.t["age"], str(self.data.get("patientAge") or "—"), c3, self.theme.purple),
            (self.t["gender"], disp_gender, c3, self.theme.green),
        ], h=64)
        y = self._row_fields(y, [
            (self.t["guardian"], self._get_guardian(), c2, self.theme.green),
            (self.t["assessment_date"], str(self.data.get("date") or "—"), c2, self.theme.purple),
        ], h=64)
        self._row_fields(y, [
            (self.t["evaluator"], str(self.data.get("psicologoName") or "—"), c3, self.theme.green),
            (self.t["crp"], str(self.data.get("psicologoCrp") or "—"), c3, self.theme.purple),
            (self.t["clinic"], str(self.data.get("clinica") or "—"), c3, self.theme.green),
        ], h=72)

        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(0.8)
        self.c.line(self.X, 100 - 6, self.X, 100 + 44)
        style = ParagraphStyle(
            "covernote", fontName=self.fonts.body, fontSize=8.5, leading=12.0,
            textColor=self.theme.navy, alignment=TA_LEFT,
        )
        p = Paragraph(self.t["cover_note"], style)
        p.wrap(280, 80)
        p.drawOn(self.c, self.X + 17, 100 + 10)

        self._footer("")
        self.c.showPage()

    def add_anamnese_toc(self, dynamic_pages: dict[str, str]):
        sec = self.t["sections"]
        p = dynamic_pages
        items = [
            TocItem("01", sec["01"]["title"], p.get("01", "03")),
            TocItem("02", sec["02"]["title"], p.get("02", "04")),
            TocItem("03", sec["03"]["title"], p.get("03", "05")),
            TocItem("04", sec["04"]["title"], p.get("04", "06")),
            TocItem("05", sec["05"]["title"], p.get("05", "07")),
            TocItem("06", sec["06"]["title"], p.get("06", "08")),
            TocItem("07", sec["07"]["title"], p.get("07", "09")),
            TocItem("08", sec["08"]["title"], p.get("08", "10")),
            TocItem("09", sec["09"]["title"], p.get("09", "11")),
            TocItem("10", sec["10"]["title"], p.get("10", "12")),
            TocItem("11", sec["11"]["title"], p.get("11", "13")),
            TocItem("12", self.t["conclusion_title"], p.get("12", "14")),
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

        # Nota de rodapé da página
        self.c.setStrokeColor(self.theme.green)
        self.c.setLineWidth(0.8)
        self.c.line(self.X, 100 - 6, self.X, 100 + 44)
        style = ParagraphStyle(
            "tocdesc", fontName=self.fonts.body, fontSize=8.5, leading=12.0,
            textColor=self.theme.navy, alignment=TA_LEFT,
        )
        p = Paragraph(self.t["toc_desc"], style)
        p.wrap(280, 80)
        p.drawOn(self.c, self.X + 17, 100 + 10)
        self.c.showPage()

    # ------------------------------------------------------------------
    # Seções da Anamnese (11 Seções Padronizadas e Refinadas)
    # ------------------------------------------------------------------
    def section_01(self, page_no: str):
        self.section_pages["01"] = page_no
        y = self._page_header("01", page_no)
        c3 = (self.CONTENT_W - 2*self.GAP) / 3
        c2 = (self.CONTENT_W - self.GAP) / 2

        # Card de Identificação Resumido no topo da Seção 01
        raw_gender = self.data.get("patientGender") or self.data.get("gender") or "—"
        if self.lang == "en":
            disp_gender = "Male" if ("masc" in raw_gender.lower() or "male" in raw_gender.lower()) else ("Female" if "fem" in raw_gender.lower() else raw_gender)
        else:
            disp_gender = raw_gender

        y = self._row_fields(y, [
            (self.t["patient"], str(self.data.get("patientName") or "—"), c3, self.theme.green),
            (self.t["age"], str(self.data.get("patientAge") or "—"), c3, self.theme.purple),
            (self.t["gender"], disp_gender, c3, self.theme.green),
        ], h=62)
        y = self._row_fields(y, [
            (self.t["guardian"], self._get_guardian(), c2, self.theme.green),
            (self.t["assessment_date"], str(self.data.get("date") or "—"), c2, self.theme.purple),
        ], h=62)

        # Queixa principal em auto-panel robusto com respiro
        lbl = self.t["sections"]["01"]["s01_queixa_historico"]
        self._auto_panel(lbl, self.X, y, self.CONTENT_W,
                         text=self._get_val("s01_queixa_historico"), min_h=230,
                         fill=self.soft_green, border=self.card_border)
        self._end_page()

    def section_02(self, page_no: str):
        self.section_pages["02"] = page_no
        y = self._page_header("02", page_no)
        sec = self.t["sections"]["02"]
        c2 = (self.CONTENT_W - self.GAP) / 2

        y = self._row_fields(y, [
            (sec["s02_gestacao_planejada"], self._get_val("s02_gestacao_planejada"), c2, self.theme.green),
            (sec["s02_prenatal"], self._get_val("s02_prenatal"), c2, self.theme.purple),
        ], h=66)
        y = self._row_fields(y, [
            (sec["s02_idade_mae"], self._get_val("s02_idade_mae"), c2, self.theme.purple),
            (sec["s02_idade_pai"], self._get_val("s02_idade_pai"), c2, self.theme.green),
        ], h=66)
        self._auto_panel(sec["s02_complicacoes"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s02_complicacoes"), min_h=230,
                         fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    def section_03(self, page_no: str):
        self.section_pages["03"] = page_no
        y = self._page_header("03", page_no)
        sec = self.t["sections"]["03"]
        c2 = (self.CONTENT_W - self.GAP) / 2

        y = self._row_fields(y, [
            (sec["s03_tipo_parto"], self._get_val("s03_tipo_parto"), c2, self.theme.green),
            (sec["s03_chorou"], self._get_val("s03_chorou"), c2, self.theme.purple),
        ], h=68)
        y = self._row_fields(y, [
            (sec["s03_uti"], self._get_val("s03_uti"), c2, self.theme.purple),
            (sec["s03_ictericia"], self._get_val("s03_ictericia"), c2, self.theme.green),
        ], h=68)
        self._row_fields(y, [
            (sec["s03_peso"], self._get_val("s03_peso"), c2, self.theme.green),
            (sec["s03_altura"], self._get_val("s03_altura"), c2, self.theme.purple),
        ], h=68)
        self._end_page()

    def section_04(self, page_no: str):
        self.section_pages["04"] = page_no
        y = self._page_header("04", page_no)
        sec = self.t["sections"]["04"]
        c2 = (self.CONTENT_W - self.GAP) / 2

        # Subtítulo explicativo em banner suave
        banner_h = 42.0
        self._card(self.X, y - banner_h, self.CONTENT_W, banner_h, fill=self.soft_purple, border=self.purple_border)
        self._paragraph(f"<b>{sec['subtitle']}</b>", self.X + 16, y - 12, self.CONTENT_W - 32,
                        font=self.fonts.body_semibold, size=9.2, leading=13.0, color=self.theme.purple)
        y -= banner_h + self.V_GAP

        y = self._row_fields(y, [
            (sec["s04_cabeca"], self._get_val("s04_cabeca"), c2, self.theme.green),
            (sec["s04_palavras"], self._get_val("s04_palavras"), c2, self.theme.purple),
        ], h=68)
        y = self._row_fields(y, [
            (sec["s04_engatinhar_andar"], self._get_val("s04_engatinhar_andar"), c2, self.theme.purple),
            (sec["s04_desfralde"], self._get_val("s04_desfralde"), c2, self.theme.green),
        ], h=68)
        self._auto_panel(sec["s04_tiques"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s04_tiques"), min_h=100, fill=self.soft_green)
        self._end_page()

    def section_05(self, page_no: str):
        self.section_pages["05"] = page_no
        y = self._page_header("05", page_no)
        sec = self.t["sections"]["05"]
        c2 = (self.CONTENT_W - self.GAP) / 2

        y = self._row_fields(y, [
            (sec["s05_alimentacao_infancia"], self._get_val("s05_alimentacao_infancia"), c2, self.theme.green),
            (sec["s05_alimentacao_atual"], self._get_val("s05_alimentacao_atual"), c2, self.theme.purple),
        ], h=68)
        y = self._row_fields(y, [
            (sec["s05_sono_tranquilo"], self._get_val("s05_sono_tranquilo"), c2, self.theme.purple),
            (sec["s05_horas_sono"], self._get_val("s05_horas_sono"), c2, self.theme.green),
        ], h=68)
        y = self._blank_field(sec["s05_dorme_sozinho"], self.X, y, self.CONTENT_W,
                              val=self._get_val("s05_dorme_sozinho"), h=64, accent=self.theme.yellow, fill=self.soft_yellow)
        self._auto_panel(sec["s05_disturbios_sono"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s05_disturbios_sono"), min_h=110,
                         fill=self.soft_purple, border=self.purple_border, accent=self.theme.purple)
        self._end_page()

    def section_06(self, page_no: str):
        self.section_pages["06"] = page_no
        y = self._page_header("06", page_no)
        sec = self.t["sections"]["06"]
        c3 = (self.CONTENT_W - 2*self.GAP) / 3

        y = self._row_fields(y, [
            (sec["s06_curiosidade"], self._get_val("s06_curiosidade"), c3, self.theme.green),
            (sec["s06_masturbacao"], self._get_val("s06_masturbacao"), c3, self.theme.purple),
            (sec["s06_orientacao"], self._get_val("s06_orientacao"), c3, self.theme.green),
        ], h=74)
        self._auto_panel(sec["s06_relatos"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s06_relatos"), min_h=285,
                         fill=self.soft_green, border=self.card_border)
        self._end_page()

    def section_07(self, page_no: str):
        self.section_pages["07"] = page_no
        y = self._page_header("07", page_no)
        sec = self.t["sections"]["07"]
        c3 = (self.CONTENT_W - 2*self.GAP) / 3

        y = self._auto_panel(sec["s07_doencas"], self.X, y, self.CONTENT_W,
                             text=self._get_val("s07_doencas"), min_h=100, fill=self.soft_green)
        y = self._row_fields(y, [
            (sec["s07_traumatismo"], self._get_val("s07_traumatismo"), c3, self.theme.purple),
            (sec["s07_enxaqueca"], self._get_val("s07_enxaqueca"), c3, self.theme.green),
            (sec["s07_convulsoes"], self._get_val("s07_convulsoes"), c3, self.theme.purple),
        ], h=74)
        self._auto_panel(sec["s07_detalhamentos"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s07_detalhamentos"), min_h=145,
                         fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    def section_08(self, page_no: str):
        self.section_pages["08"] = page_no
        y = self._page_header("08", page_no)
        sec = self.t["sections"]["08"]

        y = self._blank_field(sec["s08_conjugal"], self.X, y, self.CONTENT_W,
                              val=self._get_val("s08_conjugal"), h=64, accent=self.theme.green, fill=self.soft_green)
        y = self._auto_panel(sec["s08_parentes"], self.X, y, self.CONTENT_W,
                             text=self._get_val("s08_parentes"), min_h=130,
                             fill=self.soft_purple, border=self.purple_border, accent=self.theme.purple)
        self._auto_panel(sec["s08_interacao"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s08_interacao"), min_h=130,
                         fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    def section_09(self, page_no: str):
        self.section_pages["09"] = page_no
        y = self._page_header("09", page_no)
        sec = self.t["sections"]["09"]

        y = self._blank_field(sec["s09_gosta_escola"], self.X, y, self.CONTENT_W,
                              val=self._get_val("s09_gosta_escola"), h=64, accent=self.theme.green, fill=self.soft_green)
        y = self._auto_panel(sec["s09_dificuldades"], self.X, y, self.CONTENT_W,
                             text=self._get_val("s09_dificuldades"), min_h=130,
                             fill=self.soft_purple, border=self.purple_border, accent=self.theme.purple)
        self._auto_panel(sec["s09_historico"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s09_historico"), min_h=140,
                         fill=self.card_fill)
        self._end_page()

    def section_10(self, page_no: str):
        self.section_pages["10"] = page_no
        y = self._page_header("10", page_no)
        sec = self.t["sections"]["10"]

        y = self._auto_panel(sec["s10_tratamentos"], self.X, y, self.CONTENT_W,
                             text=self._get_val("s10_tratamentos"), min_h=110, fill=self.soft_green)
        y = self._blank_field(sec["s10_medicacao_continua"], self.X, y, self.CONTENT_W,
                              val=self._get_val("s10_medicacao_continua"), h=64, accent=self.theme.purple, fill=self.soft_purple)
        self._auto_panel(sec["s10_nome_posologia"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s10_nome_posologia"), min_h=150,
                         fill=self.soft_yellow, border=HexColor("#EBD98A"), accent=self.theme.yellow)
        self._end_page()

    def section_11(self, page_no: str):
        self.section_pages["11"] = page_no
        y = self._page_header("11", page_no)
        sec = self.t["sections"]["11"]

        y = self._auto_panel(sec["s11_impressao"], self.X, y, self.CONTENT_W,
                             text=self._get_val("s11_impressao"), min_h=165,
                             fill=self.soft_green, border=self.card_border)
        self._auto_panel(sec["s11_plano"], self.X, y, self.CONTENT_W,
                         text=self._get_val("s11_plano"), min_h=165,
                         fill=self.soft_purple, border=self.purple_border, accent=self.theme.purple)
        self._end_page()

    def add_conclusion(self, page_no: str):
        self.section_pages["12"] = page_no
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
        self.c.drawRightString(self.RIGHT, self.H - 114, str(page_no))

        y = self.H - 338
        y = self._auto_panel(self.t["conclusion_subtitle"], self.X, y, self.CONTENT_W,
                             text=f"{self.t['conclusion_p1']}<br/><br/>{self.t['conclusion_p2']}",
                             min_h=140, fill=self.soft_green)

        # Autenticidade e assinatura
        psi_name = self.data.get("psicologoName") or self.data.get("psicologo_name") or "—"
        psi_crp = self.data.get("psicologoCrp") or self.data.get("crp") or "—"
        date_str = self.data.get("date") or "—"

        validacao_texto = (
            f"Clinical anamnesis recorded electronically under professional responsibility of "
            f"<b>{psi_name} ({psi_crp})</b> on {date_str}. "
            f"All information recorded adheres to ethical regulations and professional confidentiality."
            if self.lang == "en" else
            f"Anamnese clínica registrada eletronicamente sob responsabilidade técnica de "
            f"<b>{psi_name} ({psi_crp})</b> na data de {date_str}. "
            f"As informações aqui consolidadas seguem os preceitos éticos e sigilo profissional regulatório."
        )
        self._auto_panel(self.t["auth_title"], self.X, y, self.CONTENT_W,
                         text=validacao_texto, min_h=100, fill=self.soft_purple,
                         border=self.purple_border, accent=self.theme.purple)

        self.c.setFillColor(self.theme.navy)
        self.c.setFont(self.fonts.body, 13.2)
        self.c.drawString(self.X, 154, self.t["slogan"])
        self.c.setStrokeColor(self.theme.green)
        self.c.line(self.X, 137, self.X + 57, 137)
        self.c.showPage()

    def build(self):
        # Mapeamento dinâmico de 14 páginas:
        # Pág 01: Capa
        # Pág 02: Sumário
        # Pág 03: 01. Motivo da Consulta
        # Pág 04: 02. Gestação e Pré-Natal
        # Pág 05: 03. Parto e Nascimento
        # Pág 06: 04. Desenvolvimento Psicomotor
        # Pág 07: 05. Sono e Alimentação
        # Pág 08: 06. Sexualidade e Curiosidade
        # Pág 09: 07. História Médica e Saúde
        # Pág 10: 08. Ambiente Familiar e Social
        # Pág 11: 09. Escolaridade e Aprendizagem
        # Pág 12: 10. Tratamentos Anteriores e Medicação
        # Pág 13: 11. Observações Finais e Conduta
        # Pág 14: 12. Conclusão e Autenticidade
        dynamic_pages = {
            "01": "03",
            "02": "04",
            "03": "05",
            "04": "06",
            "05": "07",
            "06": "08",
            "07": "09",
            "08": "10",
            "09": "11",
            "10": "12",
            "11": "13",
            "12": "14",
        }
        self.add_anamnese_cover()
        self.add_anamnese_toc(dynamic_pages)
        self.section_01("03")
        self.section_02("04")
        self.section_03("05")
        self.section_04("06")
        self.section_05("07")
        self.section_06("08")
        self.section_07("09")
        self.section_08("10")
        self.section_09("11")
        self.section_10("12")
        self.section_11("13")
        self.add_conclusion("14")
        self.save()


def build(output_path: str | Path, data: dict | None = None) -> Path:
    doc = TekoAnamnesePDF(output_path, data=data)
    doc.build()
    return doc.output_path


MOCK_ANAMNESE_PT = {
    "lang": "pt",
    "patientName": "Lucas Gabriel Silva",
    "patientAge": "8 anos e 4 meses",
    "patientGender": "Masculino",
    "responsavel": "Helena Silva (Mãe)",
    "psicologoName": "Dra. Mariana Costa",
    "psicologoCrp": "CRP 06/142589",
    "clinica": "Centro Teko de Neuropsicologia",
    "date": "01/10/2026",
    "queixa": "A mãe relata que a criança apresenta dificuldade intensa de concentração nas tarefas escolares, agitação motora constante em sala de aula, além de impulsividade ao interromper conversas de adultos e colegas.",
    "desejada": True,
    "prenatal": True,
    "idadeMae": "29 anos",
    "idadePai": "32 anos",
    "doencasGestacao": "Pressão alta leve e ansiedade gestacional acompanhadas com acompanhamento médico pré-natal contínuo.",
    "tipoParto": "Normal",
    "chorouAoNascer": True,
    "uti": False,
    "ictericia": True,
    "pesoNascer": "3.250 kg",
    "alturaNascer": "49 cm",
    "sentar": "6 meses",
    "primeirasPalavras": "11 meses",
    "andar": "13 meses",
    "desfralde": "24 meses",
    "tiques": False,
    "alimentacaoInfancia": "Materna",
    "alimentacaoAtual": "Boa e variada",
    "sonoTranquilo": False,
    "horasSono": "8 horas",
    "dormeSozinho": True,
    "disturbiosSono": "Apresenta agitação motora noturna, pesadelos ocasionais e resistência no horário de dormir.",
    "curiosidadeSexual": True,
    "manipulacao": False,
    "orientacaoSexual": True,
    "relatosSex": "Curiosidade natural e saudável compatível com a faixa etária do desenvolvimento infantil.",
    "doencasAnteriores": "Asma brônquica na infância de intensidade leve.",
    "traumatismo": False,
    "enxaqueca": True,
    "convulsao": False,
    "detalhesMedicos": "Cefaleia tensional esporádica associada ao cansaço escolar prolongado no término da tarde.",
    "situacaoPais": "Vivem juntos",
    "relacionamentos": "Excelente relacionamento com pais e irmãos. Convivência familiar diária harmoniosa e acolhedora.",
    "interacaoSocial": "Sociável e comunicativo, faz amigos com facilidade, porém demonstra impaciência durante jogos de regras.",
    "gostaEscola": True,
    "dificuldadeEscolar": "Dificuldade na sustentação atencional durante leitura prolongada, redação e cálculo mental.",
    "historicoEscolar": "Frequentou a educação infantil com boa adaptação social. Sem histórico de reprovações escolares.",
    "tratamentos": "Acompanhamento psicopedagógico prévio durante 6 meses.",
    "usoMedicacao": False,
    "medicacoes": "Nenhuma medicação contínua no momento.",
    "impressaoGeral": "Quadro clínico e comportamental compatível com perfil de instabilidade atencional e inquietação motora.",
    "planoIntervencao": "Encaminhamento para avaliação neuropsicológica completa através da bateria gamificada de biomarcadores Teko."
}

MOCK_ANAMNESE_EN = {
    "lang": "en",
    "patientName": "Lucas Gabriel Silva",
    "patientAge": "8 years and 4 months",
    "patientGender": "Male",
    "responsavel": "Helena Silva (Mother)",
    "psicologoName": "Dr. Mariana Costa",
    "psicologoCrp": "CRP 06/142589",
    "clinica": "Teko Neuropsychology Center",
    "date": "10/01/2026",
    "queixa": "The mother reports that the child shows intense difficulty concentrating on school tasks, constant motor restlessness in the classroom, and impulsivity when interrupting conversations.",
    "desejada": True,
    "prenatal": True,
    "idadeMae": "29 years",
    "idadePai": "32 years",
    "doencasGestacao": "Mild hypertension and gestational anxiety monitored with continuous prenatal medical care.",
    "tipoParto": "Vaginal",
    "chorouAoNascer": True,
    "uti": False,
    "ictericia": True,
    "pesoNascer": "3.250 kg",
    "alturaNascer": "49 cm",
    "sentar": "6 months",
    "primeirasPalavras": "11 months",
    "andar": "13 months",
    "desfralde": "24 months",
    "tiques": False,
    "alimentacaoInfancia": "Breastfeeding",
    "alimentacaoAtual": "Good and balanced",
    "sonoTranquilo": False,
    "horasSono": "8 hours",
    "dormeSozinho": True,
    "disturbiosSono": "Shows nocturnal restlessness, occasional nightmares, and bedtime resistance.",
    "curiosidadeSexual": True,
    "manipulacao": False,
    "orientacaoSexual": True,
    "relatosSex": "Natural and healthy curiosity consistent with childhood developmental stage.",
    "doencasAnteriores": "Mild childhood bronchial asthma.",
    "traumatismo": False,
    "enxaqueca": True,
    "convulsao": False,
    "detalhesMedicos": "Occasional tension headaches associated with academic fatigue at the end of the afternoon.",
    "situacaoPais": "Living together",
    "relacionamentos": "Excellent relationship with parents and siblings. Harmonious and warm daily family atmosphere.",
    "interacaoSocial": "Sociable and communicative, makes friends easily, but shows impatience during turn-taking games.",
    "gostaEscola": True,
    "dificuldadeEscolar": "Difficulty sustaining focus during continuous reading, essay writing, and mental arithmetic.",
    "historicoEscolar": "Attended early childhood education with positive social adaptation. No history of grade repetition.",
    "tratamentos": "Previous psychopedagogical support for 6 months.",
    "usoMedicacao": False,
    "medicacoes": "No continuous medication prescribed at this time.",
    "impressaoGeral": "Clinical and behavioral presentation consistent with attentional instability and motor restlessness.",
    "planoIntervencao": "Referral for comprehensive neuropsychological assessment using Teko gamified digital biomarkers battery."
}


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate the dynamic Teko anamnesis PDF (Bilingual PT/EN).")
    parser.add_argument("--output", default="Teko_Anamnese_Totalmente_Preenchida_PT.pdf")
    parser.add_argument("--data", default=None, help="JSON string or path to JSON file with field answers")
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
    if not input_data:
        input_data = MOCK_ANAMNESE_EN if args.lang == "en" else MOCK_ANAMNESE_PT

    print(build(args.output, data=input_data))
