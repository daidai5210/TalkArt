---
name: Artful Play
colors:
  surface: '#fdf9e9'
  surface-dim: '#dedacb'
  surface-bright: '#fdf9e9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f4e4'
  surface-container: '#f2eede'
  surface-container-high: '#ece8d9'
  surface-container-highest: '#e6e3d3'
  on-surface: '#1c1c13'
  on-surface-variant: '#3d4a3e'
  inverse-surface: '#323126'
  inverse-on-surface: '#f5f1e1'
  outline: '#6d7b6d'
  outline-variant: '#bccabb'
  surface-tint: '#006d36'
  primary: '#006d36'
  on-primary: '#ffffff'
  primary-container: '#4ade80'
  on-primary-container: '#005e2d'
  inverse-primary: '#4de082'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#64a8fe'
  on-secondary-container: '#003c70'
  tertiary: '#a43073'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffacd2'
  on-tertiary-container: '#932265'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6dfe9c'
  primary-fixed-dim: '#4de082'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005227'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#fdf9e9'
  on-background: '#1c1c13'
  surface-variant: '#e6e3d3'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-bold:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 48px
  stack-gap: 16px
---

## Brand & Style
The design system is centered on the concept of "Digital Papercraft." It targets children aged 6-15, evoking a sense of creative confidence, warmth, and discovery. The brand personality is that of an encouraging art teacher: patient, bright, and tactile.

The design style merges **Modern Minimalism** with **Tactile/Skeuomorphic** elements. By utilizing high-radius rounded corners and subtle "paper-stack" shadows, the UI feels physical and approachable. It avoids the coldness of standard software in favor of a vibrant, high-contrast, and "squishy" aesthetic that invites physical interaction.

## Colors
The palette is "Fresh & Bright," utilizing high-energy pastels and vibrant accents to maintain a high-stimulation but low-stress environment.

- **Primary (Mint Green):** Used for "Go" actions, growth, and the primary voice interaction.
- **Secondary (Artistic Blue):** Used for instructional elements and tool selections.
- **Tertiary (Pink):** Reserved for rewards, celebrations, and playful highlights.
- **Background (Cream Paper):** A soft, off-white cream (#FFFBEB) serves as the "paper" base, reducing eye strain compared to pure white and feeling more like an art sketchbook.
- **Ink:** Instead of pure black, a deep slate is used for text to maintain a soft, organic feel.

## Typography
The typography system prioritizes legibility and friendliness. 

**Quicksand** is used for headlines and labels; its rounded terminals mimic hand-drawn lettering and provide a soft, non-threatening hierarchy. **Plus Jakarta Sans** is used for body copy to ensure clarity during longer instructional steps, as its modern geometric structure remains highly readable at various sizes. 

Font sizes are intentionally scaled up by 20% compared to standard SaaS applications to accommodate younger users and ensure clear call-outs.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous safe areas to prevent accidental taps. 

- **Desktop:** A 12-column grid with wide 48px margins to frame the art canvas as the center of attention.
- **Mobile/Tablet:** A 4-column or 8-column grid with 20px margins. 
- **Rhythm:** Spacing follows an 8px scale. Content groups use 24px (3x) gaps to maintain a "breathable" and organized "paper" feel. Elements are often centered to create a focused, linear learning path.

## Elevation & Depth
This design system uses **Tactile Tonal Layers** to simulate physical paper and stickers. 

- **Level 0 (Canvas):** The base cream #FFFBEB background with a subtle grain texture.
- **Level 1 (Paper Sheets):** White cards with 1px solid borders (#E2E8F0) and "chunky" shadows (0px 4px 0px 0px rgba(0,0,0,0.05)).
- **Level 2 (Interactive Elements):** Buttons and active chips use a "Deep Drop" shadow (0px 6px 0px 0px) in a darker shade of the component's color to create a 3D, "pressable" appearance.
- **Level 3 (Modals/Xiao Zhi):** Floating elements use high-blur ambient shadows to appear as if they are hovering significantly above the page.

## Shapes
The shape language is ultra-rounded to ensure the environment feels safe and friendly. All containers use a minimum radius of 24px (`rounded-xl`). 

Interactive elements like buttons and input fields utilize the **Pill-shape** (`rounded-full`) convention. For larger cards or drawing areas, a "Squircle" effect is preferred over sharp corners to maintain the playful aesthetic.

## Components

- **Chunky Buttons:** Primary buttons are pill-shaped, large (min-height 64px), and feature a 4px bottom-offset shadow that disappears when "pressed" (active state), simulating a physical click.
- **Voice Button:** A large, circular Mint Green (#4ADE80) button. When active, it features a pulsing "halo" animation and a simple microphone icon.
- **Xiao Zhi Chat Bubbles:** Rounded rectangular bubbles with a "tail" pointing to the avatar. Use a soft white background and 20px body text.
- **Step Markers:** Circular bubbles containing numbers. Active steps should be larger and colored in Artistic Blue, while completed steps show a friendly checkmark.
- **Input Fields:** Thick 2px borders with high-contrast focus states. Placeholders should be phrased as questions (e.g., "What's your name?").
- **Art Cards:** Display student work on white "Polaroid-style" cards with generous bottom margins for captions and dates.