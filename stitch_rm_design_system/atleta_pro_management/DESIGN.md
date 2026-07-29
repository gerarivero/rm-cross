---
name: Atleta Pro Management
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#534436'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#857464'
  outline-variant: '#d8c3b1'
  surface-tint: '#8a5100'
  primary: '#8a5100'
  on-primary: '#ffffff'
  primary-container: '#e8973a'
  on-primary-container: '#5c3400'
  inverse-primary: '#ffb86e'
  secondary: '#4f6264'
  on-secondary: '#ffffff'
  secondary-container: '#cfe3e6'
  on-secondary-container: '#536668'
  tertiary: '#006684'
  on-tertiary: '#ffffff'
  tertiary-container: '#3cb5e2'
  on-tertiary-container: '#004358'
  error: '#F44336'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcbd'
  primary-fixed-dim: '#ffb86e'
  on-primary-fixed: '#2c1600'
  on-primary-fixed-variant: '#693c00'
  secondary-fixed: '#d2e6e8'
  secondary-fixed-dim: '#b6cacc'
  on-secondary-fixed: '#0c1e20'
  on-secondary-fixed-variant: '#384a4c'
  tertiary-fixed: '#bee9ff'
  tertiary-fixed-dim: '#69d3ff'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#004d64'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  success: '#4CAF50'
  warning: '#FFC107'
  info: '#2196F3'
  border: '#D0D0D0'
  text-muted: '#757575'
  surface-white: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is engineered for a high-performance fitness management environment. It balances the high-energy vitality of physical training with the rigorous, structured nature of administrative oversight. The personality is **authoritative, energetic, and data-centric**, ensuring that gym owners can manage complex student data with speed and precision.

The design style follows a **Corporate / Modern** aesthetic with a strong emphasis on functional utility. It utilizes a structured grid, high-contrast action elements, and a "status-first" visual hierarchy. By combining clean surfaces with vibrant interactive cues, the interface remains approachable while signaling the reliability of a professional management tool. The primary goal is to minimize cognitive load by using color as a functional signal for business health and student status.

## Colors

The color palette is built on a high-contrast foundation to differentiate between navigation, content, and action.

- **Primary Orange** is reserved for critical interactive elements (CTAs), active navigation states, and highlighting primary brand moments. 
- **Secondary Slate** provides the structural backbone, used for sidebars, table headers, and primary typography to ensure a grounded, professional feel.
- **Semantic Palette** follows a strict "Traffic Light" metaphor:
    - **Success (Green):** Indicates "Al Día" (Up to date) status and completed transactions.
    - **Warning (Yellow):** Indicates "Próxima a Vencer" (Near expiry) for proactive management.
    - **Error (Red):** Indicates "Vencida" (Expired) or critical data errors.
- **Neutral Backgrounds** alternate between pure white and a soft light gray to create visual separation between dashboard sections without the need for heavy borders.

## Typography

This design system uses **Hanken Grotesk** for all primary UI interactions. Its sharp, contemporary grotesque style reflects a modern fitness aesthetic while maintaining exceptional legibility in data-heavy tables.

- **Headlines:** Use Bold (700) weights with tighter letter spacing for a punchy, athletic feel in dashboard titles.
- **Subheadings:** SemiBold (600) weights provide clear section demarcation within cards and modals.
- **Body Text:** Regular (400) weight is used for general descriptions and student details, prioritizing a comfortable 1.5 line-height for readability.
- **Data Display:** For financial records, IDs, or technical metrics, **JetBrains Mono** is utilized to ensure numerical alignment and clarity.

## Layout & Spacing

The layout is built on a **12-column fluid grid** for desktop, transitioning to a single-column stack for mobile devices. A strict **8px spacing scale** ensures a consistent rhythmic flow throughout the application.

- **Margins:** Desktop views use 24px (lg) margins to provide breathing room for data-heavy views. Mobile views reduce this to 16px (md).
- **Gutter:** A consistent 24px gutter is maintained between cards and layout columns to prevent information density from feeling overwhelming.
- **Alignment:** All elements must snap to the 8px grid. Use 16px (md) internal padding for standard cards and 8px (sm) for condensed list items.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and functional **Ambient Shadows**.

1.  **Level 0 (Background):** The base layer uses `#F5F5F5` to ground the interface.
2.  **Level 1 (Cards/Surfaces):** Main content areas use pure white (`#FFFFFF`) with a subtle 1px border (`#D0D0D0`) and a soft shadow (`0px 2px 8px rgba(0, 0, 0, 0.08)`) to create a floating effect.
3.  **Level 2 (Modals/Overlays):** These use a stronger elevation shadow to draw focus, accompanied by a semi-transparent dark backdrop to dim the underlying dashboard.
4.  **Interaction:** Buttons and interactive cards use a slightly intensified shadow on hover to provide tactile feedback without excessive movement.

## Shapes

The shape language is **Soft (1)**, prioritizing a professional and efficient appearance.

- **Inputs and Buttons:** Use a 4px corner radius. This creates a "precision tool" feel that fits the administrative context.
- **Cards and Modals:** Use an 8px (rounded-lg) radius to soften larger surfaces and make the application feel modern and accessible.
- **Status Badges:** Use a full-pill radius (rounded-full) to distinguish them from interactive buttons.
- **Active Indicators:** Sidebar active states use a vertical bar on the left edge with a 0px radius to maintain a structural, rigid feel.

## Components

### Buttons
- **Primary:** Background `#E8973A`, text white, 4px radius. High-impact for "Save," "Add Member," or "Pay."
- **Secondary:** Background `#2C3E40`, text white. Used for secondary administrative tasks.
- **Ghost:** Transparent background, primary color border and text. Used for "Cancel" or less frequent actions.

### Inputs & Fields
- **Default:** 1px border `#D0D0D0`, 4px radius, white background.
- **Focus State:** Border transitions to `#E8973A` with a subtle 2px orange glow (outer shadow).
- **Error State:** Border transitions to `#F44336`.

### Tables (Administrative)
- **Header:** Dark Slate (`#2C3E40`) background with white, Bold text.
- **Rows:** Alternating zebra-striping using `#F5F5F5` for even rows.
- **Dividers:** 1px solid border at the bottom of each row.

### Status Badges (Cuotas)
- Small, pill-shaped labels.
- Use Semantic colors (Success, Warning, Error) as background with high-contrast text.
- Example: "Al Día" (Green), "Vencida" (Red).

### Cards
- Pure white background, 8px radius, 1px `#D0D0D0` border.
- Used for student profiles, financial summaries, and KPI metrics on the dashboard.