# GaunPulse — Complete UI/UX & Design System Audit

**Audit Date:** November 22, 2026  
**Auditors:** Principal Product Designer, Senior UX Researcher, Accessibility Engineer, Design Systems Architect  
**Platform:** GaunPulse — The Village That Speaks  
**Scope:** Frontend Application (`frontend/src/`) — All Pages, Shell Components, Shared UI, Design Tokens, and Micro-interactions.

---

## 1. Executive Summary

GaunPulse is a mission-critical rural infrastructure intelligence and decision-support platform for Nepal's local governments. While the core GIS, simulation, and reporting engines are fully operational and connected to real MySQL and NetworkX backends, the visual presentation suffered from "AI template aesthetic":
- Overuse of CSS linear/radial gradients, floating decorative circles, and pseudo-element mountain illustrations.
- Inconsistent color palettes (a mix of ad-hoc hex values, multiple shades of green, and arbitrary borders).
- Unrestrained typography (oversized serif headings on operational screens, missing tabular numerals on metrics, and weak Devanagari fallback).
- Redundant badges (such as repetitive `📡 Live Data` tags repeated across every dashboard card).
- Layout clutter on map and simulation pages where floating cards obscured operational map viewports.

This audit establishes the baseline findings and defines the design system foundation inspired by the visual restraint, clarity, and information hierarchy of **Linear, Stripe Dashboard, Notion, and Vercel**, customized specifically for municipal decision-makers in Nepal.

---

## 2. Core Design Direction & Color Palette

In strict adherence to product requirements, all decorative gradients are banned. All surfaces, cards, and buttons use solid backgrounds with subtle borders and restrained shadows.

### Standardized Color Tokens:
| Token Name | Hex Value | Semantic Purpose |
|---|---|---|
| **Primary Dark Forest** | `#123D30` | Sidebar background, primary brand accents, dark headers |
| **Primary Green** | `#267153` | Primary action buttons, active navigation indicators, key highlights |
| **Page Background** | `#F7F7F3` | Clean, calm page canvas (high legibility, low eye-strain) |
| **Surface (Card/Modal)** | `#FFFFFF` | Solid white cards, modals, popovers, table containers |
| **Subtle Surface** | `#F1F4EF` | Table header rows, secondary card panels, subtle pill backgrounds |
| **Border** | `#D9E3DB` | Clean, subtle 1px divider for cards, inputs, and tables |
| **Primary Text** | `#172E25` | High-contrast readable typography for headings, metrics, table cells |
| **Secondary Text** | `#66786D` | Contextual subtitles, metadata, form helper text |
| **Warning / Attention** | `#B7792C` | High-severity alerts, in-progress tasks, medium-risk bridges |
| **Danger / Critical** | `#C64F45` | Critical disruptions, blocked lifeline roads, error states |
| **Success / Verified** | `#1B7340` | Verified physical infrastructure, completed action plans |

---

## 3. Page-by-Page Audit & Usability Deficiencies

### 3.1 Main Dashboard (`DashboardPage.jsx`, `WelcomeBanner.jsx`, `StatCard.jsx`)
- **Deficiencies:**
  - `WelcomeBanner.jsx` contained a 290px-tall illustrated scene with mountains (`.welcome-scene__mountain`), a sun (`.welcome-scene__sun`), and stepped terrace silhouettes, pushing operational KPIs below the fold.
  - The hero greeting was hardcoded (`"Good morning, Asha"`), lacking dynamic user identity bindings.
  - Every metric card (`StatCard.jsx`) had a prominent green `📡 Live Data` badge, causing repetitive visual noise.
  - Metrics lacked tabular numerals (`font-variant-numeric: tabular-nums`), causing jitter during data refresh.
- **Prescribed Solution:**
  - Replace the illustrated banner with a compact, restrained municipal welcome header:
    - `"Good morning, [User]"`
    - `"Here's what needs attention across your municipality."`
    - Concise contextual badge near the header indicating live MySQL / NetworkX connectivity once, eliminating repetitive card badges.
  - Redesign KPI cards into clean, solid white containers with clear labels, tabular figures, and click-through navigation to relevant modules.

### 3.2 Application Shell (`Sidebar.jsx`, `Header.jsx`, `AppLayout.jsx`)
- **Deficiencies:**
  - `Sidebar.jsx` used multiple layered radial and linear gradients (`linear-gradient(165deg, var(--forest-900), var(--forest-950) 78%)`).
  - Active navigation item had a high-contrast orange left stripe (`#f29b4b`) and light-green background that clashed with the palette.
  - `Header.jsx` search input used semi-transparent background with weak border definition.
- **Prescribed Solution:**
  - Apply solid `#123D30` forest-green background to the sidebar with a subtle `#1D4D3E` border.
  - Refine active nav state to a restrained, solid `#1C4B3C` background with crisp white icon and label.
  - Make topbar sticky with solid `#FFFFFF` background (or 98% solid `#F7F7F3`), crisp bottom border `#D9E3DB`, and streamlined search and notification controls.

### 3.3 Village Map (`VillageMapPage.jsx`)
- **Deficiencies:**
  - Floating panels and search overlays covered over 40% of the map on standard 1366x768 screens.
  - GIS statistics cards at the bottom competed visually with the map canvas.
  - Modal dialogues (Add Village, Add Asset) had dense form fields with uneven spacing.
- **Prescribed Solution:**
  - Transform into a clean GIS workspace:
    - Top compact toolbar: Village selector, Nepal coordinate search, layer toggles, and "Add Infrastructure" primary action.
    - Large uninterrupted Leaflet map canvas.
    - Clean collapsible right inspection panel for selected node/edge attributes.
    - Expandable bottom drawer for network diagnostics and topology metrics.

### 3.4 Issues & Alerts (`IssuesPage.jsx`)
- **Deficiencies:**
  - Issue list used inconsistent pill colors for severity levels (`critical`, `high`, `medium`, `low`).
  - Filter bar wrapped awkwardly across multiple lines on smaller viewports.
  - Status update dialog lacked clear step-by-step guidance.
- **Prescribed Solution:**
  - Clean filter toolbar with unified search, category selector, severity filter, and primary `"Report Issue"` button.
  - High-legibility data table with structured columns: Issue Title, Village & Ward, Category, Severity Badge, Status Badge, Report Date, and Action menu.
  - Clean modal dialog for issue reporting with clear validation states.

### 3.5 Simulations (`SimulationsPage.jsx`)
- **Deficiencies:**
  - Left control sidebar was crowded with nested sub-cards and redundant border outlines.
  - Disruption metrics (affected households, critical isolation) lacked clear before-and-after comparison hierarchy.
- **Prescribed Solution:**
  - Clean two-column split layout: Left parameter panel (Village, Lifeline Asset, Disaster Scenario, Run Simulation) and Right simulation map + impact cards.
  - Restrained before/after impact summary cards with clear tabular figures and color-coded lifeline severity.

### 3.6 Action Plans (`ActionPlansPage.jsx`)
- **Deficiencies:**
  - Action plan cards had multiple nested dividers and redundant progress percentages.
  - Priority badges lacked unified typography.
- **Prescribed Solution:**
  - Tabbed or filterable list/table view showing Priority, Plan Title, Target Village & Ward, Assigned Engineering Unit, Due Date, Progress Bar, and Quick Edit action.
  - Minimalist progress bar with solid primary green fill (`#267153`) on subtle background (`#D9E3DB`).

### 3.7 Reports & Insights (`ReportsInsightsPage.jsx`)
- **Deficiencies:**
  - Several KPI cards previously had label overlap issues due to fixed pixel heights and nested divs.
  - Export controls were scattered across the screen.
- **Prescribed Solution:**
  - Standardized KPI cards using flexible grid auto-fit.
  - Compact analytical filter toolbar with date range and administrative cascade.
  - Consistent Chart.js canvas containers with responsive aspect ratios and honest empty states.

### 3.8 AI Agent (`AIAgentPage.jsx` & `src/components/ai-workspace/`)
- **Deficiencies:**
  - Exposed 6 separate specialized agent tabs simultaneously, overwhelming municipal non-technical officers with technical terminology.
- **Prescribed Solution:**
  - Implement a clean, human-centered entry point:
    - Greeting: `"How can I help your village today?"`
    - 4 Guided action cards:
      1. **Find Urgent Problems** (Prioritizes community triage)
      2. **Check Infrastructure Impact** (Simulates road/bridge failure)
      3. **Create a Report** (Summarizes municipal trends)
      4. **Plan a Repair** (Prepares draft capital work action plans)
    - Natural language prompt bar with progressive disclosure for deep diagnostic reasoning.

### 3.9 Village Data Manager (`VillageDataPage.jsx`, `VillageManagerHome.jsx`)
- **Deficiencies:**
  - Village cards previously showed identical duplicate records and false `"Verified Network"` badges for unverified OSM data.
- **Prescribed Solution:**
  - Exactly one card per genuine village with clean administrative metadata: `Village Name (District · Ward X)`.
  - Clear, honest verification badges: Green `"Verified Network"` only for physically inspected villages; Blue `"Ready for Simulation"` for technically complete graphs; Yellow `"Needs Data"` for incomplete networks.

---

## 4. Typography & Accessibility Standards

- **Primary Typeface:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Nepali Devanagari Fallback:** `"Noto Sans Devanagari", "Mukta", sans-serif`
- **Tabular Figures:** Applied to all metrics, dates, and statistics via CSS `font-variant-numeric: tabular-nums`.
- **WCAG 2.2 AA Compliance:**
  - Text-to-background contrast ratio >= 4.5:1 for normal text, >= 3.0:1 for large text and UI components.
  - Visible focus rings: `outline: 2px solid #267153; outline-offset: 2px;` on all interactive buttons, links, and inputs.
  - Explicit `aria-labels`, `aria-expanded`, and semantic HTML headings (`h1` through `h4`).
  - Mobile touch targets >= 44x44px.

---

## 5. Reviewable Milestone Execution Roadmap

| Milestone | Target Scope | Output Deliverables |
|---|---|---|
| **Milestone 1** | Design Tokens, Typography, Shared `ui.jsx`, `Sidebar.jsx`, `Header.jsx`, `AppLayout.jsx` | Solid tokens in `index.css`, clean sidebar, professional header |
| **Milestone 2** | Dashboard, KPI Cards, Welcome Area, Dashboard Grid Previews | Refined `DashboardPage.jsx`, `WelcomeBanner.jsx`, `StatCard.jsx` |
| **Milestone 3** | GIS Village Map, Issues & Alerts, Simulation Workspace | Restructured `VillageMapPage.jsx`, `IssuesPage.jsx`, `SimulationsPage.jsx` |
| **Milestone 4** | Action Plans, Reports & Insights, Village Data Manager | Refined `ActionPlansPage.jsx`, `ReportsInsightsPage.jsx`, `VillageManagerHome.jsx` |
| **Milestone 5** | AI Agent Workspace, Responsive & Accessibility Polish, Documentation | Refined `AIAgentPage.jsx`, design system docs, final verification |
