# GAUNPULSE — AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)

## 1. Overview & Architecture

**GaunPulse — The Village That Speaks** enforces a unified, defense-in-depth authentication and authorization architecture tailored to the administrative hierarchy of rural Nepal.

All authentication operations are backed by **Laravel Sanctum** issuing cryptographically secure Bearer tokens with strict role scoping and active account verification middleware.

```
       ┌────────────────────────────────────────────────────────┐
       │             GaunPulse Unified Auth Flow                │
       └──────────────────────────┬─────────────────────────────┘
                                  │ POST /api/login
                                  ▼
                     ┌─────────────────────────┐
                     │  Credentials & Active   │
                     │       Verification      │
                     └────────────┬────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
  [system_admin]        [municipality_admin]       [ward_officer]
   - All Municipalities  - Scoped to Municipality   - Scoped to Muni & Ward
   - Token: sysadmin     - Token: muniadmin         - Token: wardofficer
```

---

## 2. Canonical Roles & Permissions Matrix

| Role | Canonical Identifier | Scope | Key Capabilities & Authorization |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `system_admin` | Global (All Municipalities) | Cross-municipality oversight, user creation/promotion, global audit logging, municipality workspace provisioning, all network simulations. |
| **Municipality Administrator** | `municipality_admin` | Local Municipality | Manage municipal staff, assign ward officers, approve action plans, verify issues, view municipal audit logs, trigger local NetworkX simulations. Cannot escalate to `system_admin`. |
| **Ward Technical Officer** | `ward_officer` | Local Municipality + Assigned Ward | Verify infrastructure issues in assigned ward, submit field reports, update resolution progress, inspect ward network readiness. Cannot modify other wards or municipalities. |
| **Citizen Resident** | `citizen` | Public / Village Scope | Submit complaints/infrastructure issues, upload field photos and voice notes, track resolution status, view public notifications. |

---

## 3. Middleware Security Boundaries

The Laravel backend implements the following security middleware in `backend/app/Http/Middleware`:

1. **`active` (`EnsureActive.php`)**:
   - Checks if `$user->is_active === true`.
   - If deactivated, immediately revokes existing tokens and aborts with `403 Forbidden` (`Your account has been deactivated`).
2. **`role:{requiredRole}` (`CheckRole.php`)**:
   - Enforces specific role or role groups (`admin` includes `system_admin` and `municipality_admin`; `staff` includes `ward_officer`).
3. **`admin` (`EnsureAdmin.php`)**:
   - Ensures user has administrator status (`system_admin` or `municipality_admin`).

---

## 4. Privilege Escalation Prevention

To prevent horizontal and vertical privilege escalation:
1. **Public Registration (`/api/citizen/register`)**:
   - Explicitly hardcodes `'role' => 'citizen'`. Any `role` passed in request payload is discarded.
2. **Staff Promotion (`/api/admin/users/{user}/role`)**:
   - Only `system_admin` may grant or revoke the `system_admin` role.
   - `municipality_admin` can only assign roles between `citizen`, `ward_officer`, and `municipality_admin` within their own municipality.
   - Attempting to grant `system_admin` returns `403 Forbidden`.

---

## 5. Token Lifecycle & Management

| Action | Endpoint | Method | Token Name Issued / Behavior |
| :--- | :--- | :--- | :--- |
| **Staff & Admin Login** | `/api/login` | POST | `gaunpulse-sysadmin`, `gaunpulse-muniadmin`, or `gaunpulse-wardofficer` |
| **Citizen Login** | `/api/citizen/login` | POST | `gaunpulse-citizen` |
| **Logout** | `/api/logout` | POST | Revokes current Sanctum Access Token |
| **Password Change** | `/api/user/change-password` | POST | Verifies `current_password`, hashes `new_password` with Bcrypt, records audit log |
| **Forgot Password** | `/api/forgot-password` | POST | Secure reset flow with rate limiting (5 req/min) |

---

## 6. Audit Logging Integration

All security events (logins, logouts, role updates, ward assignments, account toggles, password updates) are automatically recorded in the immutable `audit_logs` table via `AuditLog::record(...)`, preserving actor ID, summary, entity ID, and client timestamp.
