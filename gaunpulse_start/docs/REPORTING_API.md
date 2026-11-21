# GaunPulse — Municipal Reporting & Analytics API Documentation

This document describes the real-time reporting and analytics endpoints available under `/api/reports/*` and `/api/dashboard/*` in Laravel.

---

## 1. Public Dashboard Statistics
- **Endpoint**: `GET /api/dashboard/stats`
- **Description**: Returns top-level real-time counts for the municipal dashboard.
- **Response Format**:
```json
{
  "monitored_villages": 18,
  "active_issues": 7,
  "critical_disruptions": 3,
  "affected_households": "73",
  "resolved_issues": 1,
  "total_action_plans": 5,
  "action_plans_in_progress": 5,
  "community_voices_count": 2
}
```

---

## 2. Executive Overview & KPIs
- **Endpoint**: `GET /api/reports/overview`
- **Query Parameters**:
  - `village_id` (integer, optional)
  - `municipality` (string, optional)
  - `district` (string, optional)
  - `ward` (string/int, optional)
  - `from` (YYYY-MM-DD, optional)
  - `to` (YYYY-MM-DD, optional)
  - `category` (string, optional)
  - `status` (string, optional)
  - `severity` (string, optional)
  - `infrastructure_type` (string, optional)
- **Response Format**:
```json
{
  "generated_at": "2026-11-21T19:38:52+00:00",
  "timezone": "UTC",
  "filters_applied": [],
  "kpis": {
    "resolution_rate": {
      "value": 12.5,
      "formatted": "12.5%",
      "resolved_count": 1,
      "eligible_count": 8,
      "total_issues": 8,
      "rejected_count": 0
    },
    "median_verification": {
      "hours": 0,
      "days": 0,
      "formatted": "0 h",
      "verified_issues_count": 3,
      "unverified_issues_count": 5
    },
    "community_reports": {
      "total": 10,
      "citizen_issue_reports": 8,
      "community_feedback_count": 2
    },
    "active_issues": {
      "count": 7,
      "critical_count": 3
    }
  },
  "infrastructure": {
    "total_nodes": 4512,
    "total_edges": 4587,
    "total_facilities": 381,
    "roads": 2474,
    "bridges": 32,
    "schools": 172,
    "health_facilities": 48,
    "water_access": 161,
    "settlements": 36
  },
  "action_plans": {
    "total": 5,
    "completed": 0,
    "in_progress": 5,
    "draft": 0,
    "overdue": 0,
    "average_progress": 59
  },
  "simulations": {
    "total_scenarios": 26,
    "villages_analyzed": 3,
    "is_simulated": true,
    "disclaimer": "Scenario outcomes are simulated estimates based on network topology, not confirmed damage."
  }
}
```

---

## 3. Issue Category Breakdown
- **Endpoint**: `GET /api/reports/categories`
- **Query Parameters**: Same filters as Overview.
- **Response Format**:
```json
{
  "total": 8,
  "categories": [
    { "category": "damaged_bridge", "label": "Damaged Bridge", "count": 4, "percentage": 50.0 },
    { "category": "damaged_road", "label": "Damaged Road", "count": 3, "percentage": 37.5 },
    { "category": "water_supply", "label": "Drinking Water Supply", "count": 1, "percentage": 12.5 }
  ]
}
```

---

## 4. Multi-Month Trends Timeline
- **Endpoint**: `GET /api/reports/trends`
- **Query Parameters**:
  - `range`: `6m` (default), `12m`, `24m`
  - Same filters as Overview.
- **Response Format**:
```json
{
  "months_count": 6,
  "timeline": [
    { "month_key": "2026-06", "label": "Jun 2026", "submitted": 0, "resolved": 0 },
    ...
    { "month_key": "2026-11", "label": "Nov 2026", "submitted": 8, "resolved": 1 }
  ]
}
```

---

## 5. Status & Severity Distribution
- **Endpoints**:
  - `GET /api/reports/status-distribution`
  - `GET /api/reports/priorities`
- **Response Format**: Canonical grouping across `submitted`, `under_review`, `verified`, `in_progress`, `resolved`, `rejected` and severities (`critical`, `high`, `medium`, `low`).

---

## 6. Ward Comparison Benchmark
- **Endpoint**: `GET /api/reports/ward-comparison`
- **Response Format**: Wards mapped to total issues vs resolved issues.

---

## 7. Infrastructure Condition & Verification
- **Endpoint**: `GET /api/reports/infrastructure-condition`
- **Response Format**: Passability breakdown of edges (`passable`, `blocked`, `caution`) and node verification breakdown (`verified`, `community_reported`, `unverified`).

---

## 8. Filtered Audit Records
- **Endpoint**: `GET /api/reports/records`
- **Query Parameters**:
  - `type`: `issues` | `edges` | `nodes` | `action_plans` | `feedback`
  - `page`: Page number (default 1)
  - `per_page`: Number per page (default 10, max 100)
  - `search`: Keyword string
- **Response Format**: Standard Laravel pagination object.

---

## 9. Data Export Engine
- **Endpoint**: `GET /api/reports/export`
- **Query Parameters**:
  - `format`: `csv` | `json`
  - `type`: `issues` | `edges` | `nodes` | `action_plans` | `feedback` | `all`
- **CSV Security**:
  - Prefix-escaped against CSV injection for cells starting with `=`, `+`, `-`, or `@`.
  - Encoded with UTF-8 BOM (`\xEF\xBB\xBF`) for Nepali Devanagari character fidelity in Microsoft Excel.

---

## 10. AI Insights Synthesis
- **Endpoint**: `POST /api/reports/ai-insights`
- **Description**: Synthesizes factual findings, critical bottlenecks, and data limitations from the active MySQL filter scope.
