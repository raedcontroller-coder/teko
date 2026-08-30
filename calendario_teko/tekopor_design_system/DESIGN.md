---
name: TekoPorã Design System
colors:
  surface: '#f7faf8'
  surface-dim: '#d7dbd9'
  surface-bright: '#f7faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f3'
  surface-container: '#ebefed'
  surface-container-high: '#e5e9e7'
  surface-container-highest: '#e0e3e1'
  on-surface: '#181c1c'
  on-surface-variant: '#3e4947'
  inverse-surface: '#2d3130'
  inverse-on-surface: '#eef1f0'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0d766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#7fd5cc'
  secondary: '#635e4f'
  on-secondary: '#ffffff'
  secondary-container: '#eae2cf'
  on-secondary-container: '#6a6455'
  tertiary: '#7f4025'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c573a'
  on-tertiary-container: '#ffe5db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9bf2e8'
  primary-fixed-dim: '#7fd5cc'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#eae2cf'
  secondary-fixed-dim: '#cec6b4'
  on-secondary-fixed: '#1f1b10'
  on-secondary-fixed-variant: '#4b4639'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb598'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#72361b'
  background: '#f7faf8'
  on-background: '#181c1c'
  surface-variant: '#e0e3e1'
  accent-lilas: '#7B61FF'
  accent-amarelo: '#FFC857'
  surface-white: '#FFFFFF'
  structural-dark: '#084D48'
  structural-light: '#64C6BE'
  disabled-gray: '#E0E0E0'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
---

## Brand & Style
The brand personality is **nurturing, playful, and scientifically grounded**. It bridges the gap between a high-stakes clinical environment and a low-anxiety, gamified experience for children. The UI must evoke feelings of safety, curiosity, and warmth.

The chosen design style is **Modern Tactile**. It utilizes soft, organic shapes and a distinct color-blocking strategy to create a "digital toybox" feel. This approach maintains professional clarity for clinicians through structured layouts while remaining approachable for children through friendly iconography and rounded geometry. High-contrast legibility is prioritized to ensure the cognitive load remains on the evaluation tasks, not the interface itself.

## Colors
This design system follows a strict **60-30-10 distribution** to ensure visual harmony and clinical focus.

- **Base (60%):** `#FFF6E3` (Bege Claro). Used for large background areas to reduce eye strain and provide a warm, paper-like canvas.
- **Structural (30%):** `#0D766E` (Verde Água Escuro). Used for primary navigation, headers, and key functional elements. It provides the "professional" anchor of the palette.
- **Accents (10%):** 
    - `#7B61FF` (Lilás): Represents imagination and emotional development. Used for special interaction feedback and secondary highlights.
    - `#FFC857` (Amarelo): Used for high-priority calls to action, alerts, and "celebration" moments.

**Logo Integration:**
- On **Light Backgrounds (#FFF6E3)**: Use the structural green bee logo with the lilac or yellow eye detail.
- On **Dark Backgrounds (#0D766E)**: Use the cream-colored bee logo with the yellow eye detail to ensure maximum contrast and visibility.

## Typography
**Plus Jakarta Sans** is the sole typeface. It was chosen for its geometric yet soft terminals, making it highly readable for children (friendly and open) while appearing modern and precise for clinicians.

- **Weight Usage:** Use **Bold (700)** for primary game titles and headers. Use **Medium (500)** or **Regular (400)** for instructional text to ensure a gentle tone.
- **Hierarchy:** Maintain generous line heights (1.5x) to accommodate users with developing literacy or those under cognitive stress.
- **Clinician Views:** For data-heavy screens (metrics/telemetry), shift to `label-lg` in uppercase for a more "analytical" and professional feel.

## Layout & Spacing
The system utilizes a **Fluid Grid** model with a base unit of **8px**. 

- **Mobile First:** Designed for touch interactions. A minimum tap target of 48px is enforced for all interactive elements.
- **Safe Zones:** A 24px margin is maintained around the screen edges to prevent elements from feeling cramped.
- **Reflow Rules:**
    - **Mobile:** Single column list or 2-column grid for game cards.
    - **Tablet:** 3 to 4-column grid for the "Game Catalog" to utilize the horizontal real estate for clinicians.
- **Negative Space:** Use the Base color (#FFF6E3) aggressively to separate functional blocks, ensuring the child's focus is never split between more than two competing visual elements.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Soft Ambient Shadows**. 

1. **Surface Tier:** The background is always `#FFF6E3`.
2. **Container Tier:** Cards and interactive containers use `#FFFFFF` with a very soft, diffused shadow (Blur: 15px, Y: 4px, Opacity: 5%, Color: `#0D766E` tint).
3. **Interactive Tier:** Buttons use solid color fills (Primary or Accent) with a slight "pressed" state elevation change (reducing shadow spread).
4. **Locked State:** Elements utilize a 50% opacity mask with a desaturated "disabled-gray" appearance and a central lock icon, creating a clear visual distinction between active and future content.

## Shapes
The shape language is **distinctly rounded** to remove any visual "sharpness" that might provoke anxiety. 

- **Standard Elements:** Use a 16px (1rem) radius for game cards and large containers.
- **Buttons:** Use fully rounded (pill-shaped) ends for primary actions to make them appear more "toy-like" and touchable.
- **Input Fields:** Use an 8px radius to maintain a professional balance for clinician-facing data entry.

## Components

- **Game Cards:** White backgrounds with large, centered icons. Use the Structural Green for the game title and the Accent colors for "New" or "Category" tags.
- **Primary Buttons:** High-contrast Structural Green (#0D766E) with White text for clinicians; Accent Yellow (#FFC857) with Structural Green text for "Start Game" actions to attract the child's eye.
- **Chips / Tags:** Use the Accent Lilás (#7B61FF) with 10% opacity backgrounds and solid text for categorizing cognitive constructs (e.g., "Inhibition", "Memory").
- **Lists:** Clean, borderless rows separated by subtle 1px lines in a slightly darker cream tint.
- **Input Fields:** Outlined style using the structural color at 20% opacity. Focus state should use a 2px solid border in Structural Green.
- **Telemetry Cards:** Special containers for clinicians that use a "White" surface with "Structural Green" headers to display technical data (Reaction times, error rates) clearly and authoritatively.