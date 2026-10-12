from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

@dataclass
class TocItem:
    number: str
    title: str
    page: str

class ThemeColors:
    navy = HexColor("#1D2D44")
    green = HexColor("#1E5E4E")
    purple = HexColor("#7B61FF")
    yellow = HexColor("#F59E0B")
    bg = HexColor("#FFFDF9")
    muted = HexColor("#6A7280")

class ThemeFonts:
    body = "Helvetica"
    body_semibold = "Helvetica-Bold"
    display = "Helvetica-Bold"
    display_regular = "Helvetica"

class TekoPDF:
    def __init__(
        self,
        output_path: str | Path,
        logo_path: Path | None = None,
        top_corner_asset: Path | None = None,
        bottom_corner_asset: Path | None = None,
        footer_label: str = "ANAMNESE",
    ):
        self.output_path = Path(output_path)
        self.W, self.H = A4
        self.c = canvas.Canvas(str(self.output_path), pagesize=A4)
        self.logo_path = logo_path
        self.top_corner_asset = top_corner_asset
        self.bottom_corner_asset = bottom_corner_asset
        self.footer_label = footer_label
        self.theme = ThemeColors()
        self.fonts = ThemeFonts()

    def _set_alpha(self, stroke: float = 1.0, fill: float = 1.0) -> None:
        self.c.saveState()
        self.c.setStrokeAlpha(stroke)
        self.c.setFillAlpha(fill)

    def _reset_alpha(self) -> None:
        self.c.restoreState()

    def _begin_page(self, page_no: str = "", motifs: bool = True, logo: bool = False) -> None:
        if motifs:
            self._corner_motifs()
        if logo and self.logo_path and self.logo_path.exists():
            self._draw_logo(48, self.H - 50, 145)
        if page_no:
            self._footer(page_no)

    def _corner_motifs(self, *, bottom_leaves: bool = True) -> None:
        if self.top_corner_asset and self.top_corner_asset.exists():
            self._draw_asset_right(self.top_corner_asset, self.H + 4, width=198, top_anchor=True, overscan=8)
        if bottom_leaves and self.bottom_corner_asset and self.bottom_corner_asset.exists():
            self._draw_asset_right(self.bottom_corner_asset, -4, width=213, top_anchor=False, overscan=10)

    def _draw_asset_right(self, path: Path, y: float, width: float, top_anchor: bool = False, overscan: float = 0):
        if not path.exists():
            return
        im = ImageReader(str(path))
        iw, ih = im.getSize()
        h = width * ih / iw
        x = self.W - width + overscan
        draw_y = y - h if top_anchor else y
        self.c.drawImage(im, x, draw_y, width=width, height=h, preserveAspectRatio=True, mask="auto")

    def _draw_logo(self, x: float, y_top: float, width: float = 160) -> None:
        if self.logo_path and self.logo_path.exists():
            im = ImageReader(str(self.logo_path))
            iw, ih = im.getSize()
            h = width * ih / iw
            self.c.drawImage(im, x, y_top - h, width=width, height=h, preserveAspectRatio=True, mask="auto")

    def _draw_tracking_text(
        self,
        text: str,
        x: float,
        y: float,
        *,
        font: str = "Helvetica-Bold",
        size: float = 8.0,
        color: HexColor = HexColor("#1D2D44"),
        tracking: float = 1.0,
    ) -> None:
        self.c.saveState()
        self.c.setFillColor(color)
        self.c.setFont(font, size)
        self.c.drawString(x, y, text)
        self.c.restoreState()

    def _paragraph(
        self,
        text: str,
        x: float,
        y: float,
        width: float,
        *,
        font: str = "Helvetica",
        size: float = 10.0,
        leading: float = 14.0,
        color: HexColor = HexColor("#1D2D44"),
    ) -> float:
        style = ParagraphStyle(
            name="TekoStyle",
            fontName=font,
            fontSize=size,
            leading=leading,
            textColor=color,
        )
        p = Paragraph(text, style)
        w, h = p.wrap(width, self.H)
        p.drawOn(self.c, x, y - h)
        return h

    def _footer(self, page_no: str) -> None:
        self.c.saveState()
        self.c.setFillColor(self.theme.muted)
        self.c.setFont(self.fonts.body, 8)
        self.c.drawString(45, 30, f"TEKO  •  2026  •  {self.footer_label}")
        if page_no:
            self.c.drawRightString(self.W - 45, 30, page_no)
        self.c.restoreState()

    def save(self) -> Path:
        self.c.save()
        return self.output_path
