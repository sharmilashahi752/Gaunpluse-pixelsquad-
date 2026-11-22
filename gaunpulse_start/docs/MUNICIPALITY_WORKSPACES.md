# GAUNPULSE — DYNAMIC MUNICIPALITY WORKSPACES

## 1. Overview & Architecture

**GaunPulse — The Village That Speaks** replaces static municipality displays with dynamic, context-aware workspaces.

Each municipality operates as an isolated administrative domain with its own wards, villages, network topologies, issues, and action plans.

```
                  ┌───────────────────────────────┐
                  │       Active Municipality     │
                  │   (e.g., Mahabu / Helambu)    │
                  └───────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
    [Wards 1..N]              [Villages]            [Infrastructure]
  - Ward Officers          - Scoped by muni_id     - Nodes & Edges
  - Ward Scoped Issues     - GeoJSON / OSM nodes   - Failure Simulations
```

---

## 2. Dynamic Workspace Switching

- **Multi-Municipality Workspace Switcher**:
  - Located in `Header.jsx`.
  - Available to `system_admin` users.
  - Allows instant switching between **Mahabu (Dailekh)**, **Helambu (Sindhupalchok)**, **Banke**, **Gharapjhong (Mustang)**, and **Solukhumbu**.
  - Automatically loads the respective wards, villages, and infrastructure.

- **Localized Staff Scoping**:
  - `municipality_admin`: Permanently pinned to their municipality ID. Attempts to query or mutate records belonging to other municipalities are rejected with `403 Forbidden`.
  - `ward_officer`: Pinned to their municipality and specific ward (e.g. Ward 1). Any cross-ward modifications return `403 Forbidden`.

---

## 3. Database Scoping & Schema

### `municipalities` Table Schema
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | Primary Key |
| `name` | `VARCHAR(255)` | Official Nepali/English Municipality Name |
| `code` | `VARCHAR(50) UNIQUE` | URL-safe slug (e.g., `mahabu`, `helambu`) |
| `district` | `VARCHAR(255)` | District Name (e.g., `Dailekh`, `Sindhupalchok`) |
| `province` | `VARCHAR(255)` | Province Name (e.g., `Karnali`, `Bagmati`) |
| `type` | `VARCHAR(50)` | `rural_municipality`, `municipality`, `metropolitan` |
| `ward_count` | `SMALLINT UNSIGNED`| Total count of wards (e.g., 5, 7, 9) |
| `center_lat` | `DECIMAL(10, 7)` | Geographic centroid latitude |
| `center_lng` | `DECIMAL(10, 7)` | Geographic centroid longitude |

### Scoping Relationships
- `Municipality -> hasMany(Village)`
- `Municipality -> hasMany(User)`
- `Municipality -> hasMany(AuditLog)`
- `Village -> belongsTo(Municipality)`
- `User -> belongsTo(Municipality)`

---

## 4. Ward Officer Assignment Workflow

1. An administrator navigates to **User Management** (`#/user-management`).
2. Locates a user in the staff roster and clicks **Assign Ward**.
3. Selects an authorized ward from the municipality's available wards (`1` through `ward_count`).
4. The system sends `POST /api/admin/users/{user}/assign-ward` with `{ ward_number: N }`.
5. The backend assigns the ward, elevates role to `ward_officer` if necessary, and records an immutable audit log entry.
6. The ward officer's interface immediately scopes their views and action permissions to the assigned ward.

---

## 5. Security & Isolation Verification

- **Cross-Municipality Isolation**:
  Verified via automated feature test `test_municipality_admin_cannot_access_foreign_municipality_records`.
- **Cross-Ward Isolation**:
  Verified via automated feature test `test_ward_officer_cannot_modify_other_ward_issues`.
- **Frontend Fallbacks**:
  If no municipality is assigned, GaunPulse displays clean fallback messaging (`No municipality assigned · Nepal`) without breaking application state or leaking private data.
