# GaunPulse — The Village That Speaks

**Developer blueprint + functional React UI demo + independently runnable Python network simulator.**

This folder is NOT a complete installed Laravel project or a connected AI agent. The Laravel file examples need to be copied into a new application generated with Composer. The frontend is a UI reference with fictional sample data.

## Install prerequisites on Windows
- Node.js LTS (compatible with your Vite version)
- PHP 8.2+ with required Laravel extensions and Composer
- MySQL (e.g. ServBay)
- Python 3.11+ and Git
- VS Code

## 1. Test the React dashboard

In PowerShell:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite (normally http://127.0.0.1:5173). Do not assume this runs until `npm install` has completed successfully.

## 2. Run the Python simulation API

In a second PowerShell window:

```powershell
cd intelligence
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

If PowerShell prevents activation, use `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` and `.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload` instead.

Go to http://127.0.0.1:8001/docs to test POST `/simulate` with the contents of `sample-data/demo-network.json` and `failed_edge_id` set to `bridge_b`.

Expected sample result: 20 affected households see an access change; Settlement B retains a detour, but school and health-post journeys increase by 40 minutes. **This number is fictional.**

## 3. Create the Laravel backend

In another PowerShell window from the parent `gaunpulse` folder (with Composer installed):

```powershell
composer create-project laravel/laravel backend
cd backend
php artisan install:api
```

Create an empty MySQL database named `gaunpulse` using your existing MySQL administration tool. Add database connection information to backend/.env (never commit passwords):

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gaunpulse
DB_USERNAME=your_local_database_user
DB_PASSWORD=your_private_database_password
```

Copy the sample migration from `backend-starter/database/migrations/` into `backend/database/migrations/`.
Copy `backend-starter/routes/api.php` to `backend/routes/api.php`.
Then:

```powershell
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Check http://127.0.0.1:8000/api/health and http://127.0.0.1:8000/api/dashboard.

**Security:** Do not paste actual database passwords or AI keys into chat. Use least-privilege database credentials, Laravel authorization policies, private Python services, CSRF/session or secure token-based authentication, and server-side validation.

## 4. Next integrations, in order

1. Add official village CRUD endpoints with authentication, validation and roles.
2. Connect React to GET `/api/dashboard` and GET `/api/villages`.
3. Add Leaflet/OpenStreetMap mapping with proper attribution.
4. Store a georeferenced infrastructure network (nodes, edges, facilities) and support versioned imports.
5. Have Laravel call private FastAPI `/simulate` after verifying permissions.
6. Display computed before/after results, not fictional numbers.
7. Add issue reporting, verification and repair comparisons.
8. Add an AI agent that can use read-only tools; require human review for official actions.

## INNEX originality restriction

If INNEX rules require all hackathon code to be created during the 48-hour event, use this package only as a design/study blueprint beforehand. Do not submit or reuse prebuilt code unless explicitly permitted by organizers.
