GaunPulse
The Village That Speaks
A web-based infrastructure reporting, mapping, and decision-support platform for rural communities and local governments in Nepal.
Developed by Team PixelSquad.
---
About the Project
GaunPulse is a web-based platform designed to connect rural communities with local governments through digital infrastructure reporting, geographic mapping, and better-informed decision-making.
Residents can report concerns about roads, bridges, and other public infrastructure. Municipal teams can review the reports, explore village assets on an interactive map, investigate how road or bridge disruptions may affect access to essential services, and organize follow-up actions. Selected features use AI assistance; the entire platform is not AI-driven.
Our goal is to make it easier to understand what happened, where it happened, who may be affected, and what should be reviewed first.
> \*\*Our vision:\*\* A safer, smarter, and more connected rural Nepal, where every village has a voice.
Problem Statement
Rural communities can face damaged roads, unsafe bridges, and disrupted access to schools, health posts, and other essential services. Reporting and infrastructure information may be fragmented, leaving local authorities without a clear picture of the consequences of a failure or the relative urgency of multiple problems.
GaunPulse aims to address three related challenges:
Reporting gaps: Citizens need accessible ways to report infrastructure issues and follow their status.
Limited impact visibility: A damaged road or bridge may affect entire settlements, but the downstream accessibility impact is not immediately clear.
Difficult prioritization: Municipalities need structured, evidence-based information to guide inspections, planning, and responses.
Main Features
Module	Purpose
Dashboard	Overview of village information, reported issues, and planning activity.
Village Map	Interactive map to explore villages and their mapped infrastructure.
Issues & Alerts	Submit and manage infrastructure issue reports, including location and supporting details.
Simulations	Explore road or bridge disruption scenarios with graph-based connectivity analysis.
Action Plans	Organize inspection, maintenance, and response tasks.
Community Voices	Support community feedback and participation.
Reports & Insights	Display charts, summaries, and reporting information.
AI Agent	Selected AI-assisted workflows for understanding issues and supporting analysis.
Village Data Manager	Manage village records and discover or import available geographic infrastructure data.
Geographic Infrastructure Discovery
GaunPulse integrates Leaflet, OpenStreetMap, and the Overpass API to help discover geographic features such as roads, bridges, schools, health facilities, and settlements.
Discovered data is not automatically field-verified. Imported records should be checked for correct location, duplicate entries, and completeness before they are used for consequential decisions.
Infrastructure Impact Simulation
The simulation component uses Python and NetworkX to represent infrastructure as a graph:
Nodes represent relevant locations or road junctions.
Edges represent road or bridge connections.
Shortest-path calculations (for example, Dijkstra's algorithm on suitable weighted graphs) help explore routes.
Connectivity comparisons help identify possible isolation after a connection is removed.
Simulation results are scenario-based estimates, dependent on the quality and completeness of the mapped network. They are not emergency dispatch instructions or engineering safety certificates.
AI Assistance and Human Review
Selected GaunPulse features explore AI assistance for tasks such as understanding reported issues, summarizing evidence, explaining analysis, and supporting prioritization or planning. Other features operate through regular application logic, database queries, and graph algorithms.
AI suggestions are decision support, not automatic emergency decisions. Reports involving possible immediate danger should receive appropriate human review and emergency-service guidance. A GaunPulse report should not be assumed to contact or dispatch emergency responders.
Technology Stack
Layer	Technologies	Role
Frontend	React.js, JavaScript, Tailwind CSS, Vite, HTML/CSS	Responsive interface and interactive workflows
Backend	PHP, Laravel, REST APIs	Application logic, validation, and data access
Database	MySQL	Persistent village, infrastructure, and issue records
Simulation & analysis	Python, FastAPI, NetworkX	Graph modeling, shortest paths, and disruption analysis
GIS & mapping	Leaflet.js, OpenStreetMap, Overpass API	Maps and discovery of geographic features
Data visualization	Chart.js	Charts and reports
AI-assisted features	AI/LLM integration in selected workflows	Language assistance and analysis support
Development	Git, GitHub, VS Code	Version control and development
High-Level Architecture
```text
                       Citizens / Municipal Staff
                                  |
                                  v
                      React + Vite Frontend
                       (Leaflet / Chart.js)
                                  |
                                  v
                        Laravel REST API
                     (PHP application layer)
                            /           \\
                           v             v
                        MySQL       Python FastAPI
                      (records)       (NetworkX)
                                           |
                                           v
                                 Connectivity simulation

              OpenStreetMap / Overpass API -> GIS discovery
              AI-assisted features -> selected analysis workflows
```
The diagram summarizes the intended architectural responsibilities. Exact connections and enabled integrations depend on the current repository configuration.
How GaunPulse Works
Report: A citizen submits an infrastructure issue with a description and location.
Review: Authorized municipal users assess the report and its supporting evidence.
Map: The issue can be related to mapped village infrastructure.
Analyze: Where valid graph data exists, the system can simulate a road or bridge disruption and examine connectivity.
Prioritize: Officials consider reported severity, accessibility impact, and available evidence; selected AI features may assist.
Act: Municipal users create or update action plans and provide status updates.
Getting Started (Local Development)
GaunPulse has a React/Vite frontend, a Laravel/PHP backend, a MySQL database, and a Python/FastAPI simulation service. Start the components that exist in your checkout.
> \*\*Repository note:\*\* Folder paths, environment-variable names, migrations, and server ports may differ between versions. Check the actual project folders and configuration before running the commands below. Never commit real `.env` files or credentials.
Prerequisites
Node.js and npm
PHP and Composer, with extensions required by Laravel
MySQL
Python and pip
Git
1. Clone the repository
```bash
git clone <YOUR\_REPOSITORY\_URL>
cd <YOUR\_REPOSITORY\_FOLDER>
```
2. Start the frontend
From the directory containing the frontend `package.json`:
```bash
npm install
npm run dev
```
3. Configure and run Laravel
From the Laravel application directory:
```bash
composer install
```
Copy the provided Laravel environment example to `.env`, then configure the local database and API settings. If this is a new local installation, generate the application key and run the appropriate, reviewed migrations:
```bash
php artisan key:generate
php artisan migrate
php artisan serve
```
Important: Do not run destructive migration/reset commands against an existing database. Review migrations and back up important data first.
4. Run the Python service (if configured)
From the simulation service directory, install its declared dependencies. For example, if the project includes `requirements.txt`:
```bash
python -m pip install -r requirements.txt
```
Then start the FastAPI application using the actual ASGI module path from the repository documentation/configuration. Do not assume the module is named `main` or that a particular port is available.
5. Connect the services
Check the project's environment examples and application configuration for:
Laravel database connection settings
The frontend's API base URL or Vite proxy
Laravel-to-Python service address
Allowed local development origins / authentication settings
Any AI provider credentials for optional AI functionality
Keep private keys and passwords out of Git.
Validation Checklist
Before demonstrating a feature, confirm the complete workflow rather than only checking whether the page loads:
[ ] A village can be selected and its correct geographic data is displayed.
[ ] A new issue can be submitted and remains after refreshing the browser.
[ ] Imported infrastructure is linked to the correct village without unwanted duplicates.
[ ] A disruption simulation uses an asset belonging to the selected village.
[ ] Charts use the selected area's actual stored records.
[ ] AI-assisted results clearly distinguish verified facts from suggestions.
[ ] Permission checks prevent users from accessing unauthorized records.
Future Enhancements
Offline & SMS reporting: Enable residents to prepare or submit reports despite limited internet access.
Dedicated mobile application: Build an Android/iOS experience for reporting issues, following updates, and accessing village information.
Nepali and local-language voice support: Improve accessibility for people who prefer speaking to typing.
Disaster early-warning integration: Connect available official rainfall, flood, and landslide information with infrastructure maps.
Smarter emergency-access analysis: Explore alternative routes to health facilities and other essential services, with human oversight.
Predictive infrastructure maintenance: Investigate preventive inspection using sufficiently reliable historical data.
Multi-municipality expansion: Introduce secure, independent municipality workspaces and scale through validated partnerships.
These are future goals, not a claim that all of them are implemented.
Sustainability and Revenue Model
GaunPulse could pursue a business-to-government (B2G) software model while keeping citizen reporting free:
Municipality subscriptions for software access and support
One-time GIS setup, data onboarding, and staff training
Optional infrastructure analytics and reporting engagements
Project-based partnerships with NGOs and development organizations
This is a proposed model; it does not imply existing paying customers or signed partnerships.
Team PixelSquad
Team member	Role
sharmilashahi	Team Leader · Backend Developer
Sandesh Rana Chhetri	Frontend Developer
Brij Mohan Pasi	QA Tester · Researcher
Our Mission
GaunPulse connects rural communities with local governments through digital reporting, infrastructure mapping, and informed decision-making.
Every village has a voice. Every report deserves attention.
---
GaunPulse — The Village That Speaks  
Developed by Team PixelSquad.
