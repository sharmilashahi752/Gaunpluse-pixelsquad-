# GaunPulse — The Village That Speaks (गाउँ पल्स)

> An AI-assisted rural infrastructure intelligence and decision-support platform designed to help Nepalese communities and local governments understand damaged assets, simulate physical isolation impacts, and prioritize repair decisions.

Developed for the Nepalese CivicTech Hackathon by **PixelSquad**.

* **Team Repository**: [https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-](https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-)
* **Git Branch**: `GaunPulse-sandesh`

---

## 📌 Project Overview

In the rugged mid-hills and mountains of rural Nepal, damaged bridges and monsoon-induced landslides disrupt more than physical movement—they cut off children from school, block ambulances from reaching health clinics, and halt agricultural livelihoods.

**GaunPulse** is a public-facing CivicTech product showcase and information portal. It demonstrates how participatory community reporting, topological network mapping, deterministic graph simulations, and explainable AI insights can empower ward officers and community leaders to prioritize interventions before disasters isolate an entire valley.

> **Important Civic Disclosure**: This website is a **public-facing demonstration prototype**, not an administrative dashboard. All settlement names (*Sundar Gaun*), household counts, coordinate markers, and maintenance reports are synthetic demonstration data created for hackathon evaluation.

---

## 🌟 What the Public Website Demonstrates

1. **Interactive Spatial Map (`/map`)**:
   * OpenStreetMap base layer contextualizing roads, pedestrian suspension bridges, settlements, schools, and health posts.
   * Multi-layer filtering and detailed asset inspector with condition assessments and photo logs.

2. **Graph-Based Infrastructure Failure Simulator (`/demo`)**:
   * Deterministic client-side Dijkstra shortest-path calculations.
   * Dual-failure comparison evaluating whether to restore the motor bridge (BR-02) or upper suspension bridge (BR-01) first.
   * Quantifies delay times, affected household counts, and alternate walking routes without black-box estimations.

3. **Community Issues & Progress Tracking (`/issues`)**:
   * 6-stage lifecycle tracking: `Report Submitted` → `Under Review` → `Field Verification` → `Action Proposed` → `Work In Progress` → `Resolved`.
   * Real-time search, category filtering, severity indicators, and evidence dossiers with deep links to the map and simulator.

4. **Public Notices & Bulletins (`/notices`)**:
   * Timely community advisories (e.g., bridge pier scour load guidance, trail maintenance alerts, school culvert clearance).
   * Detailed action guidance checklists and connected infrastructure context.

5. **Infrastructure Insights & Data Transparency (`/insights`)**:
   * Recharts visualizations of issue categories, verification pipelines, and severity distributions.
   * Complete data provenance accounting (OpenStreetMap, synthetic graph, Dijkstra algorithm, human-in-the-loop governance).
   * Transparent methodology disclosures and technical boundaries.

6. **About, Mission & Team (`/about`)**:
   * Project vision, human-centered motivation, technology breakdown (implemented prototype vs. planned architecture), and PixelSquad team attribution.

7. **Prototype Governance Policies (`/privacy` & `/terms`)**:
   * Clear disclosures regarding demonstration data, third-party network requests (OSM map tiles, Google Fonts), and responsible research use.

---

## 🛠 Technology Stack

### Implemented Client-Side Prototype
* **Core Framework**: React 19 (JSX) with Vite 8
* **Styling & Design System**: Tailwind CSS v4 with custom Nature + Modern design tokens
* **Spatial Cartography**: Leaflet & React Leaflet with OpenStreetMap tiles
* **Data Visualization**: Recharts (bar charts, donut charts, responsive containers)
* **Icons & Animation**: Lucide React & Motion
* **Routing**: React Router DOM v7 (with `React.lazy` route-level code splitting)
* **Code Quality & Linting**: Oxlint (instantaneous sub-50ms static analysis)
* **Automated Testing**: Node.js built-in test runner (`node:test`, `node:assert/strict`)

### Proposed Production Architecture (Planned Horizon)
* **Application Backend**: Laravel & MySQL (relational database, role-based ward auth, audit logging)
* **Topological Engine**: Python & NetworkX (multi-ward elevation models, monsoon slope stability)
* **Vernacular Explanation Layer**: AI API integration for grounded Nepali/English summaries

---

## 📁 Folder Structure

```
public-website/
├── public/                 # Static assets (favicons, SVG marks)
├── src/
│   ├── assets/             # Brand illustrations
│   ├── components/
│   │   ├── demo/           # Simulator map, controls, impact results, explanation
│   │   ├── home/           # Hero, problem, solution, how it works, preview sections
│   │   ├── insights/       # Recharts charts, accessibility comparison, data sources & flow
│   │   ├── issues/         # Issue cards, search/filters, modal inspector, 6-stage timeline
│   │   ├── layout/         # Sticky Navbar, responsive AppLayout, professional Footer
│   │   ├── map/            # Leaflet map canvas, layers toolbar, inspector, legend
│   │   ├── notices/        # Notice cards, category filters, detail modal
│   │   └── ui/             # Reusable Badge, Button, Card, Container, LoadingSpinner
│   ├── data/
│   │   ├── demoNotices.js  # 4 demonstration public notices & action guidance
│   │   ├── demoVillage.js  # Synthetic Sundar Gaun topology (nodes, edges, facilities, issues)
│   │   └── routes.js       # Navigation links and footer configuration
│   ├── hooks/              # Custom React hooks (document title synchronization)
│   ├── pages/              # Route pages (Home, Map, Demo, Issues, Notices, Insights, About, Privacy, Terms)
│   ├── styles/             # Global CSS and Tailwind tokens
│   ├── utils/              # Graph algorithms (Dijkstra, repair comparison, insight generator)
│   ├── App.jsx             # React Router configuration with lazy loading
│   └── main.jsx            # React root mount
├── test/                   # Automated unit test suites (22 unit tests across 4 suites)
├── package.json            # Scripts and dependencies
├── vite.config.js          # Vite config with manual chunk splitting (leaflet, recharts)
└── README.md               # Project documentation
```

---

## 🚀 Setup & Development Instructions

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation

1. Clone or navigate into the workspace:
   ```bash
   cd C:\GaunPulse-Team-Clone\public-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Available npm Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the local Vite development server with HMR |
| `npm run build` | Compile and bundle production assets with vendor code splitting |
| `npm run lint` | Run Oxlint to verify code quality and accessibility standards |
| `npm test` | Execute the full automated unit test suite via Node test runner |
| `npm run preview` | Locally preview the production build output |

> **Note on Port Binding**: By default, Vite binds to port `5173`. If port `5173` is occupied by another process, Vite will automatically select the next available port (e.g., `5174` or `5175`). Check the terminal output for the active local URL.

---

## 🧪 Testing & Quality Assurance

GaunPulse maintains a zero-error policy across its automated test suites and linters:

```bash
# Run static analysis
npm run lint

# Run all test suites
npm test

# Verify production bundle compilation
npm run build
```

Unit tests validate:
1. **Network Connectivity & Graph Traversal**: Dijkstra shortest paths, baseline reachability, and dual-failure repair priority comparisons.
2. **Issue Dataset & Lifecycle Integrity**: Verification of 6-stage lifecycle histories, coordinate schemas, and filter queries.
3. **Notices & Insights Validation**: Cross-referencing between notices and topological asset IDs, chart distributions, and dynamic delay metrics.
4. **Site Configuration & Route Integrity**: Validating navigation paths, footer links, and team repository references.

---

## 🔒 Data Provenance & Simulation Boundaries

* **Demonstration Village**: *Sundar Gaun* is an illustrative model of a typical mid-hill Nepalese village spanning Wards 3 and 4.
* **Topological Calculations**: Travel delays (such as the +33 minute detour during Bridge BR-02 closure) are calculated using modeled terrain edge weights. They are illustrative and do not reflect real-time weather or certified engineering structural clearances.
* **OpenStreetMap Cartography**: OpenStreetMap provides cartographic base tiles under the Open Database License (ODbL). OpenStreetMap does *not* supply the simulated damage reports.
* **Independent Prototype**: GaunPulse does not claim active municipal authority, real-time government dispatch, or emergency evacuation directives.

---

## 👥 Project Team

**PixelSquad** — Nepalese CivicTech Hackathon.

* Team Repository: [https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-](https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-)
* Branch: `GaunPulse-sandesh`

*© 2026 PixelSquad. Developed as an open-source CivicTech prototype for Nepal.*
