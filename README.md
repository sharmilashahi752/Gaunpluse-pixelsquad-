# GaunPulse — The Village That Speaks

**A web-based infrastructure reporting, mapping, and decision-support platform for rural Nepal.**

Developed by **Team PixelSquad**.

## About GaunPulse

GaunPulse helps residents report local infrastructure problems and helps municipalities review them. The platform brings village reports, infrastructure maps, and planning tools together so local officials can better understand where problems occur and how communities may be affected.

## Key Features

- **Issue Reporting:** Report damaged roads, bridges, and other infrastructure concerns.
- **Village Map:** View villages and mapped infrastructure using OpenStreetMap.
- **Infrastructure Discovery:** Find and review available roads and public facilities for import.
- **Impact Simulation:** Explore how road or bridge closures affect mapped routes using NetworkX.
- **Reports & Action Plans:** Review issue trends and organize follow-up work.
- **Selected AI Features:** Assist with explanations, analysis, and prioritization where integrated.

> **Note:** GaunPulse is a decision-support tool, not an emergency dispatch service. Simulation results depend on the quality of available map data, and important decisions require human review.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, JavaScript, Vite, Tailwind CSS |
| Backend | Laravel (PHP), REST APIs |
| Database | MySQL |
| Simulation | Python, FastAPI, NetworkX |
| Mapping | Leaflet, OpenStreetMap, Overpass API |
| Charts | Chart.js |

## How It Works

1. A resident submits an infrastructure issue.
2. Municipal staff review the report and its location.
3. The system displays relevant infrastructure on the village map.
4. Available network data can be used to simulate a road or bridge disruption.
5. Officials review findings, prioritize follow-up, and track actions.

## Future Plans

- Offline and SMS-based reporting for areas with limited connectivity.
- A dedicated Android and iOS application.
- Integration with official flood, rainfall, and landslide alerts.
- Gradual expansion to more municipalities through local partnerships.

## Team PixelSquad

| Member | Role |
| --- | --- |
| **Sharmila Shahi** (`sharmilashahi`) | Team Leader & Backend Developer |
| **Sandesh Rana Chhetri** | Frontend Developer |
| **Brij Mohan Pasi** | QA Tester & Researcher |

## Project Status

GaunPulse is under active development. Some features are being tested and refined. Planned enhancements are listed separately above.

---

**GaunPulse — Turning Village Voices into Action.**
