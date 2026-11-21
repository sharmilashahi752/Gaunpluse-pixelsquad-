# GaunPulse Design System
**"The Village That Speaks" — Rural Infrastructure Intelligence Platform**
*Design Tokens, Spatial Principles, and Component Architecture for Municipal SaaS*

---

## 1. Philosophy & Inspiration

GaunPulse is designed specifically for municipality officers, ward engineers, disaster responders, and civic planners in Nepal. It balances deep geospatial and graph-theoretic power (NetworkX, OpenStreetMap, MySQL) with extreme visual calm, clarity, and human usability.

### Core Inspirations
- **Linear**: Restrained spacing, focused keyboard-accessible interactions, zero visual noise.
- **Notion**: Calm, readable typography, comfortable information density.
- **Stripe Dashboard**: Crisp tabular numerals, unambiguous financial & operational status hierarchy.
- **Vercel**: Minimalist border definitions, subtle elevation, functional color accents.
- **Apple Human Interface Guidelines**: Predictable navigation, clear hierarchy, high-contrast readable text.

---

## 2. Design Tokens

### 2.1 Color Foundation (Solid Colors Only — Strictly No Gradients)

GaunPulse strictly enforces **solid color backgrounds**. Gradient fills, gradient overlays, and decorative floating pseudo-element circles have been eliminated in favor of clean, solid surfaces with 1px subtle borders.

| Token | Hex Value | Purpose |
| :--- | :--- | :--- |
| `--primary-dark` | `#123D30` | Deep municipal forest green: used for main sidebar, dark hero containers, and brand accents. |
| `--primary-green` | `#267153` | Primary active accent: used for primary interactive buttons, active state indicators, and progress bars. |
| `--primary-dark-hover` | `#0E3026` | Hover state for dark primary surfaces. |
| `--primary-green-hover` | `#1E5B42` | Hover state for green buttons and active links. |
| `--bg-page` | `#F7F7F3` | Warm cream off-white: soft on the eyes during prolonged municipal administration. |
| `--surface` | `#FFFFFF` | Pure white: card backgrounds, modals, inputs, and primary content surfaces. |
| `--surface-subtle` | `#F1F4EF` | Subtle warm grey-green: table headers, secondary tags, search wrappers. |
| `--border` | `#D9E3DB` | Standard element border (1px solid). |
| `--border-subtle` | `#E8EFEA` | Secondary dividers and subtle table row borders. |
| `--text-primary` | `#172E25` | Deep forest black: highest contrast readability (WCAG AAA compliant on white). |
| `--text-secondary` | `#66786D` | Muted slate green: metadata, helper text, and secondary labels. |
| `--text-muted` | `#95A59B` | Placeholder text and disabled controls. |

### 2.2 Semantic & Status Colors

| Role | Solid Color | Subtle Background | Border Color |
| :--- | :--- | :--- | :--- |
| **Success** | `#1B7340` | `#E7F4EE` | `#B8E2CD` |
| **Warning / Detour** | `#B7792C` | `#FEF5E7` | `#F8DEB5` |
| **Danger / Blocked** | `#C64F45` | `#FDEEEB` | `#F7C7C2` |
| **Informational / Blue**| `#2563EB` | `#EFF6FF` | `#BFDBFE` |

---

## 3. Typography & Numerals

```css
font-family: 'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Typographic Rules
1. **Sans-Serif Standard**: Operational screens, metrics, tables, and headers strictly use **Inter** (with **Noto Sans Devanagari** fallback for Nepali text). Oversized serif headings (`Georgia`) have been eliminated from data cards.
2. **Tabular Numerals**: All numbers, coordinate pairs, distance meters, completion dates, percentages, and tracking codes enforce:
   ```css
   font-variant-numeric: tabular-nums;
   ```
   This prevents layout shifting when metrics update in real-time.
3. **Scale Hierarchy**:
   - `Display / Page Title`: 20px–22px, SemiBold (600) / Bold (700), `-0.02em` letter-spacing.
   - `Section Headings (h2, h3)`: 15px–17px, SemiBold (600), `-0.01em` letter-spacing.
   - `Card Titles / Subheaders`: 13px–14px, SemiBold (600).
   - `Body Text`: 12.5px–13.5px, Regular (400) / Medium (500), `1.5` line-height.
   - `Eyebrow / Overline`: 10.5px–11px, Bold (700), uppercase, `0.5px` letter-spacing.
   - `Captions & Timestamps`: 10.5px–11.5px, Regular (400), muted color.

---

## 4. Radii & Shadows

Excessive border radiuses (20px–25px) have been replaced with precise, compact SaaS scales:

```css
--radius-sm: 6px;   /* Buttons, inputs, badges, select pills */
--radius-md: 8px;   /* Cards, dropdowns, table wrappers */
--radius-lg: 12px;  /* Modal dialogs, major banners */

--shadow-sm: 0 1px 3px rgba(18, 61, 48, 0.05);
--shadow-md: 0 4px 12px rgba(18, 61, 48, 0.08);
--shadow-lg: 0 8px 30px rgba(18, 61, 48, 0.14);
```

---

## 5. Standard Component Specs

### 5.1 Sidebar (`src/components/Sidebar.jsx`)
- **Background**: Solid `#123D30` (Primary Dark Forest).
- **Width**: `240px` fixed, collapsible.
- **Brand Title**: `GaunPulse`, 17px SemiBold in `#FFFFFF`. Tagline: `"The Village That Speaks"` in `#8EAFA3`.
- **Navigation Links**:
  - Inactive: `#A5BEB4`, 13px font size, 6px border radius, 6px 12px padding.
  - Active: `#FFFFFF` on `#1F5443` background, with a subtle 3px solid `#4ADE80` left indicator.
  - Hover: Subtle background `#18483A`.
- **System Status Pill**: Clean solid `#0E3026` container with pulsing `#4ADE80` dot and `"MySQL 8.4 Connected"` label.

### 5.2 Header (`src/components/Header.jsx`)
- **Height**: `56px`, sticky top.
- **Background**: Solid `#FFFFFF`, border-bottom `1px solid #D9E3DB`.
- **Breadcrumb**: Clean path indication with subtle separator chevron.
- **Search Bar**: Solid `#F1F4EF` input with subtle focus ring (`2px solid rgba(38,113,83,0.2)`).
- **User Profile**: Initials avatar in solid `#123D30` with white text, no glossy gradients.
- **Notifications Popover**: Clean white popover with honest empty state (`"No unread notifications"`).

### 5.3 KPI & Metric Cards (`src/components/StatCard.jsx`)
- **Background**: Solid `#FFFFFF`, `1px solid #D9E3DB`, `border-radius: 8px`.
- **Number Typography**: 24px–26px, `font-variant-numeric: tabular-nums`, font-weight 700.
- **Interaction**: Subtle hover elevation (`translateY(-1px)`, `box-shadow: 0 4px 12px rgba(18, 61, 48, 0.08)`), clickable link to the relevant subsystem.
- **Live Indicator**: Clutter removed — repeated live badges removed from each card; single authoritative database connection shown in header/welcome banner.

### 5.4 Data Tables (`.data-table`)
- **Header (`th`)**: Solid `#F1F4EF`, 10.5px font-weight 600, uppercase letter-spacing `0.3px`, border-bottom `1px solid #D9E3DB`.
- **Body Cells (`td`)**: Solid `#FFFFFF`, padding `10px 12px`, border-bottom `1px solid #E8EFEA`.
- **Row Hover**: Solid `#F7F7F3`.
- **Numbers / Codes**: Enforces `tabular-nums`.

### 5.5 Modal Dialogs (`.modal-backdrop`, `.modal-card`)
- **Backdrop**: Solid `rgba(18, 61, 48, 0.65)` with `backdrop-filter: blur(4px)`.
- **Container**: Solid `#FFFFFF`, `border-radius: 12px`, `border: 1px solid #D9E3DB`, `box-shadow: 0 8px 30px rgba(18, 61, 48, 0.14)`.
- **Header (`.modal-header`)**: Clean 16px title with close button (`.modal-close-btn`).

### 5.6 Empty States (`<EmptyState />`)
- Standardized across all pages: subtle 32px icon in `#66786D`, clear title, helpful one-sentence explanation, and direct primary action button.

---

## 6. Responsive Breakpoint Matrix

| Breakpoint | Target Screen | Layout Behavior |
| :--- | :--- | :--- |
| `< 640px` | Mobile (e.g. 375px) | 1-column stack, horizontal scrolling for data tables, full-width modal dialogs, collapsed drawer sidebar. |
| `641px - 1024px` | Tablet (e.g. 768px) | 2-column KPI grids, 2-column action plan cards, collapsible sidebar. |
| `1025px - 1440px`| Laptop / Desktop | Full 4-column KPI layout, 2-column simulator split (left parameters, right map). |
| `> 1440px` | Ultra-wide | Max content container constraint (`1280px` or `1440px`) centered with equal margins. |
