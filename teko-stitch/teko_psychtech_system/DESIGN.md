---
name: Teko PsychTech System
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3f4947'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#6f7977'
  outline-variant: '#bec9c6'
  surface-tint: '#1e6962'
  primary: '#004943'
  on-primary: '#ffffff'
  primary-container: '#14625b'
  on-primary-container: '#95dbd2'
  inverse-primary: '#8ed3ca'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#fdcb54'
  on-secondary-container: '#725500'
  tertiary: '#66321d'
  on-tertiary: '#ffffff'
  tertiary-container: '#824832'
  on-tertiary-container: '#ffbfa9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9f0e6'
  primary-fixed-dim: '#8ed3ca'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdf9d'
  secondary-fixed-dim: '#f1c04a'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#370e01'
  on-tertiary-fixed-variant: '#6e3823'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
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
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is engineered for a B2B2C PsychTech environment, balancing the rigorous precision of clinical assessments with the warmth required for pediatric care. The brand personality is **Professional-Empathetic**: it must instill immediate confidence in clinicians and parents while remaining approachable and non-threatening for children.

The visual style follows a **Modern-Organic** movement. It utilizes a high-clarity layout with generous whitespace to reduce cognitive load during complex assessments. By blending clinical cleanliness with soft, rounded geometry and a warm, parchment-inspired base, the system avoids the "coldness" of traditional medical software, replacing it with a supportive, human-centric atmosphere.

## Colors

The palette is governed by a 60-30-10 distribution to ensure visual harmony and functional hierarchy:

- **Foundation (60%)**: `#F6F0DF` (Off-white/Bone). This serves as the primary canvas. It reduces eye strain compared to pure white and provides a calming, "non-clinical" warmth that feels residential and safe.
- **Authority (30%)**: `#14625B` (Deep Forest Green). Used for primary actions, navigation, and headers. It represents stability, growth, and professional expertise.
- **Energy (10%)**: `#F7C54F` (Soft Ochre). A strategic accent used for highlights, progress indicators, and "celebration" moments within child-facing interfaces to maintain engagement without overstimulating.

Neutral tones should favor warm grays over cool slates to maintain the organic feel of the background.

## Typography

This design system utilizes a dual-type approach to distinguish between emotional resonance and functional data:

- **Headlines (Quicksand)**: Chosen for its rounded terminals and geometric clarity. It feels friendly and accessible, reducing the "intimidation factor" of clinical terminology.
- **Body & Interface (Inter)**: A high-legibility sans-serif used for assessment questions, results, and administrative tasks. Its neutral, systematic nature ensures that complex clinical data remains the focus.

**Hierarchy Rules:**
1. Use `display-lg` exclusively for onboarding and child-facing welcome screens.
2. Use `headline-md` for clinician dashboard modules.
3. Apply `label-md` to all form field headers and button text to maintain a crisp, professional structure.

## Layout & Spacing

The layout philosophy is built on a **Fluid-Fixed Hybrid**. Content is contained within a 12-column grid to maintain professional alignment, but utilizes "Generous Breathing Room" (expanded margins) to prevent information density from overwhelming the user.

- **Desktop**: 12-column grid, 24px gutters, minimum 48px side margins.
- **Tablet**: 8-column grid, 16px gutters, 24px side margins.
- **Mobile**: 4-column grid, 16px gutters, 16px side margins.

Spacing follows an 8px base unit. Use `lg` (48px) spacing between major sections and `md` (24px) within card components to ensure the UI feels "light" and airy.

## Elevation & Depth

To maintain a soft and approachable look, this design system avoids heavy, dark shadows. Depth is communicated through **Tonal Layering** and **Soft Ambient Shadows**.

- **Level 0 (Base)**: `#F6F0DF` (The background canvas).
- **Level 1 (Cards/Surface)**: White (#FFFFFF) surfaces with a 1px border of `#E5DEC9` (a darker shade of the background). This creates a "paper-on-desk" feel.
- **Level 2 (Interactive Elements)**: For buttons and active cards, use a very soft, diffused shadow: `0px 4px 20px rgba(20, 98, 91, 0.08)`. Note the use of the primary green in the shadow tint to keep it organic.
- **Level 3 (Modals/Overlays)**: Use a slightly more pronounced shadow and a backdrop blur of 8px to focus the clinician's attention.

## Shapes

The shape language is consistently **Rounded**, reinforcing the friendly and safe brand personality.

- **Standard Elements**: Buttons, input fields, and small cards use a `0.5rem` (8px) radius.
- **Containers**: Large assessment modules and primary dashboard sections use `rounded-lg` (16px).
- **Interactive Accents**: Selection chips and "start assessment" buttons may use `rounded-xl` (24px) or pill shapes to appear more inviting and tactile.

Avoid all sharp (0px) corners to prevent the UI from feeling overly rigid or "strictly corporate."

## Components

### Buttons
- **Primary**: Solid Deep Green (`#14625B`) with White text. Bold, rounded-md.
- **Secondary**: Ghost style with Deep Green border and text. Used for less critical actions.
- **Accent**: Solid Yellow (`#F7C54F`) with Deep Green text. Reserved for "Submit" or "Finish" assessment milestones.

### Input Fields
- Use a White background with a subtle border. On focus, the border thickens to 2px Primary Green. Labels always use Inter Semi-Bold for high legibility.

### Assessment Cards
- Cards must have generous internal padding (24px+). Use the Primary Green for progress bars and the Secondary Yellow for "current step" indicators.

### Chips & Badges
- Used for clinical tags (e.g., "In Progress," "Flagged"). Use high-roundedness (Pill) and desaturated versions of the brand colors to keep them secondary to main content.

### Progress Indicators
- For child-facing assessments, use the Secondary Yellow in a thick, rounded progress track to create a sense of momentum and "gamified" achievement.