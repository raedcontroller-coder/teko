---
name: TekoPorã Bio-Digital
colors:
  surface: '#161308'
  surface-dim: '#161308'
  surface-bright: '#3d392c'
  surface-container-lowest: '#110e05'
  surface-container-low: '#1f1b10'
  surface-container: '#231f14'
  surface-container-high: '#2e2a1e'
  surface-container-highest: '#393428'
  on-surface: '#eae2cf'
  on-surface-variant: '#bdc9c6'
  inverse-surface: '#eae2cf'
  inverse-on-surface: '#343024'
  outline: '#889391'
  outline-variant: '#3e4947'
  surface-tint: '#7fd5cc'
  primary: '#7fd5cc'
  on-primary: '#003733'
  primary-container: '#0d766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#006a63'
  secondary: '#f4be4e'
  on-secondary: '#412d00'
  secondary-container: '#b8891a'
  on-secondary-container: '#382700'
  tertiary: '#c9bfff'
  on-tertiary: '#2e009c'
  tertiary-container: '#684ceb'
  on-tertiary-container: '#ede6ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9bf2e8'
  primary-fixed-dim: '#7fd5cc'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdea4'
  secondary-fixed-dim: '#f4be4e'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#e5deff'
  tertiary-fixed-dim: '#c9bfff'
  on-tertiary-fixed: '#1a0063'
  on-tertiary-fixed-variant: '#441cc8'
  background: '#161308'
  on-background: '#eae2cf'
  surface-variant: '#393428'
  deep-forest: '#084D48'
  glass-surface: rgba(255, 246, 227, 0.05)
  glass-border: rgba(255, 255, 255, 0.15)
  text-muted: rgba(255, 255, 255, 0.8)
  teko-yellow: '#E6A800'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  cta-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 120px
---

## Brand & Style

This design system establishes a high-end, immersive environment for child psychometry, bridging the gap between clinical precision and playful engagement. The aesthetic movement is **Bio-Glassmorphism**, a fusion of organic "Deep Green" foundations with futuristic, translucent digital layers. 

The personality is authoritative yet nurturing—a "Digital Forest" where technology feels like a natural extension of the therapeutic process. It aims to evoke a sense of calm focus for clinicians and a sense of wonder for children, moving away from cold medical interfaces toward a "Premium Serious Games" experience. High-quality 3D assets, subtle radial gradients, and "living" background blurs are essential to maintaining this sophisticated atmosphere.

## Colors

The palette is anchored by **Deep Forest (#084D48)**, acting as the primary background to ensure depth and reduce visual fatigue. The chromatic strategy follows a 60-30-10 rule modified for a dark, glass-centric UI:

- **Primary & Structural:** Water Green and Deep Forest establish the clinical and natural foundation.
- **Glass Layers:** The "Beige claro" (#FFF6E3) is repurposed as a low-opacity tint for translucent surfaces, maintaining warmth even in a dark environment.
- **Functional Accents:** **Teko Yellow (#E6A800)** is reserved strictly for primary Call to Actions (CTAs) and conversion points. **Lilac (#7B61FF)** serves as a secondary accent for emotional markers, imaginative play elements, or progress tracking.
- **Typography:** Pure white is used for headlines to ensure maximum contrast against dark greens, while muted whites (80% opacity) handle long-form body text.

## Typography

The typographic hierarchy prioritizes modern impact and utilitarian clarity. **Plus Jakarta Sans** is used for all "Display" and "Headline" roles, utilizing heavy weights (Bold/ExtraBold) and slightly negative letter-spacing to create a "tech-premium" look that feels intentional and solid.

**Inter** is utilized for all functional text, including body copy, labels, and data points. This ensures maximum legibility for clinical reports and telemetry data. For mobile, display sizes scale down aggressively to ensure headlines remain readable without excessive wrapping, while body sizes remain consistent to preserve accessibility.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** for desktop, shifting to a **4-column grid** for mobile. The layout philosophy is "Spacious and Immersive," using large vertical gaps (`section-gap`) to allow the glassmorphic elements and background gradients room to breathe.

Margins are generous on desktop to center the focus on the content cards. On mobile, margins tighten to 20px to maximize the interactive area for games and charts. Components should follow an 8px base grid for internal padding and stacking to maintain mathematical harmony.

## Elevation & Depth

Depth is not communicated through traditional shadows, but through **Backdrop Refraction and Tonal Layering**. 

1.  **Level 0 (Base):** Deep Forest (#084D48) with slow-moving radial gradients of lighter water-green.
2.  **Level 1 (Cards):** Translucent surfaces using `rgba(255, 246, 227, 0.05)` with a `backdrop-filter: blur(12px)`.
3.  **Level 2 (Active/Floating):** Increased blur (24px) and a subtle inner glow on the top-left border to simulate a light source.
4.  **Borders:** All glass containers must use a thin 1px border (`rgba(255, 255, 255, 0.15)`) to define the shape against the dark background.

## Shapes

The shape language is "Soft-Modern." All containers, cards, and buttons utilize a **16px (1rem) base radius**. This avoids the "sharpness" of medical software while remaining more professional than fully pill-shaped "toy" aesthetics. 

Interactive elements like input fields and small chips use a 12px radius, while large "Bento Box" style section containers may scale up to 24px or 32px to emphasize their role as structural anchors.

## Components

### Buttons
- **Primary (Conversion):** Background in #E6A800 (Teko Yellow), text in Deep Forest. Hover state includes a `scale: 1.05` transform and a soft outer glow.
- **Secondary (Glass):** Transparent background with a 1px white border. Hover fills with 10% white opacity.
- **Tertiary:** Purely text-based with an underline on hover, using Plus Jakarta Sans Bold.

### Glass Cards (Bento Style)
The signature component. Use the `glass-surface` variable with a 1px border. For the "Professional" pricing plan, increase the border opacity to 30% and add a subtle pulse animation to the outer glow.

### Input Fields
Darker than the background or semi-translucent with a subtle bottom border. Focus states should transition the border color to Lilac (#7B61FF) to indicate an "active/creative" state of data entry.

### Chips & Tags
Small, highly rounded (pill-shaped) elements. Use Lilac for "Gamified" categories and Water Green for "Clinical/Scientific" categories.

### Feedback & Animação
All interactive elements must respond to hover with a scale-up of 2-5%. Use `IntersectionObserver` to trigger a `Fade-in Up` animation for cards as the user scrolls, creating the feeling that the interface is "emerging" from the forest background.