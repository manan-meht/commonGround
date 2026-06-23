---
name: Common Ground
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#424842'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#737972'
  outline-variant: '#c2c8c0'
  surface-tint: '#4a654e'
  primary: '#4a654e'
  on-primary: '#ffffff'
  primary-container: '#8ba88e'
  on-primary-container: '#233d29'
  inverse-primary: '#b0ceb2'
  secondary: '#346665'
  on-secondary: '#ffffff'
  secondary-container: '#b5eae7'
  on-secondary-container: '#386b69'
  tertiary: '#386664'
  on-tertiary: '#ffffff'
  tertiary-container: '#7ba9a7'
  on-tertiary-container: '#093e3d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cceace'
  primary-fixed-dim: '#b0ceb2'
  on-primary-fixed: '#07200f'
  on-primary-fixed-variant: '#334d38'
  secondary-fixed: '#b8ecea'
  secondary-fixed-dim: '#9cd0cd'
  on-secondary-fixed: '#00201f'
  on-secondary-fixed-variant: '#194e4d'
  tertiary-fixed: '#bbece9'
  tertiary-fixed-dim: '#a0cfcd'
  on-tertiary-fixed: '#00201f'
  on-tertiary-fixed-variant: '#1e4e4c'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
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
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The brand personality is rooted in psychological safety, empathy, and constructive dialogue. It aims to bridge gaps between conflicting parties using an AI mediator that feels like a wise, neutral third party rather than a cold algorithm. The design style follows a **Modern Humanist** approach—blending the cleanliness of corporate SaaS with the warmth of a wellness application.

The emotional response should be one of immediate de-escalation. By using ample whitespace and a soft, "non-clinical" aesthetic, the interface reduces cognitive load and visual stress. It avoids the aggressive edges of traditional productivity tools, opting instead for a "Safe Space" digital environment that encourages patience and thoughtful reflection.

## Colors

The palette is intentionally low-stimulus to promote calm. 

- **Backgrounds:** The primary surface is `#F9F8F6` (Off-white), providing a warmer, more organic feel than pure white.
- **Primary (Sage):** Used for the main actions and "resolution" states. It signifies growth and peace.
- **Secondary/Tertiary (Teal/Blue-Green):** Used for navigation, AI interaction elements, and secondary emphasis.
- **Typography:** `#2D2D2D` (Charcoal) provides high legibility without the harshness of pure black.
- **Status Tones:** Success and Warning states use muted, desaturated versions of green and amber to provide information without triggering alarm.

## Typography

This design system uses **Inter** for its exceptional legibility and systematic yet friendly appearance. 

- **Weight Usage:** Headlines use Semibold (600) to establish authority without appearing heavy. Body text stays at Regular (400) for effortless long-form reading during mediation sessions.
- **Rhythm:** Line heights are generous (1.5x - 1.6x) to ensure the text feels airy and approachable.
- **Scale:** On mobile, large headlines are stepped down to prevent overwhelming the screen, while body sizes remain constant to preserve accessibility.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with wide margins to create a sense of focus.

- **Desktop:** 12-column grid with a maximum container width of 1200px. Content is centered to maintain a "balanced" feeling.
- **Mobile:** 4-column grid with 16px side margins. 
- **Spacing Rhythm:** Based on an 8px linear scale. Large vertical gaps (`stack-lg`) are encouraged between sections to separate different parts of a conflict-resolution workflow, preventing the user from feeling rushed.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows** rather than stark borders.

- **Surfaces:** Cards and containers use a pure white background to subtly pop against the off-white `#F9F8F6` base.
- **Shadows:** Use extremely soft, diffused shadows. The "sm" shadow role should use a 10% opacity of the charcoal text color with a 12px blur. The "md" shadow is reserved for active modals or hovering cards, using a 15% opacity with a 24px blur.
- **Borders:** Subtle `border-gray-200` (#E5E7EB) outlines are used on input fields and secondary cards to define structure without adding visual "noise."

## Shapes

The shape language is consistently **Rounded**. 

The standard radius is **0.5rem (8px)**, while larger containers like cards and input fields utilize **1rem (16px)** to emphasize the "softness" of the product. Buttons and chips may use fully rounded (pill) shapes to signify their interactable nature and differentiate them from informational containers. This avoidance of sharp corners is a psychological cue for safety and approachability.

## Components

### Buttons
- **Primary:** Solid Sage (#8BA88E) with White text. Rounded-lg.
- **Secondary:** Outline variant with Teal (#4A7C7A) border and text.
- **Ghost:** Transparent background with Charcoal text, used for low-priority actions like "Cancel" or "Go Back."

### Chat Bubbles
- **AI (Mediator):** Warm Grey (#E5E7EB) with Charcoal text. Placed on the left.
- **User:** Soft Sage (#8BA88E) with White text. Placed on the right. 
- *Styling:* High border radius (16px) with a smaller radius on the "tail" corner.

### Inputs & Cards
- **Input Fields:** Large 16px padding, 1rem radius, and a subtle #E5E7EB border. On focus, the border transitions to Teal (#4A7C7A) with a soft outer glow.
- **Cards:** White background, 1rem radius, and a "sm" ambient shadow.

### Progress Indicators
- **Horizontal Steps:** Simple dots connected by thin lines. Completed steps use Sage; the current step uses a Teal pulse; upcoming steps use muted Grey.

### Navigation
- **Mobile:** A bottom navigation bar with simple line icons and labels.
- **Desktop:** A minimalist top header with a clear "Safe Exit" or "Help" button always visible.

### Status Badges
- Small, pill-shaped indicators using muted background fills (e.g., `#D1DBCC` for "Resolved") with dark-toned text of the same hue for high contrast and readability.