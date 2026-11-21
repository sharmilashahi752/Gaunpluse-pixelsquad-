# GaunPulse — Village Data Entry Workflow

## Overview

GaunPulse allows administrators and municipal engineers to onboard any village in Nepal into MySQL with complete spatial, administrative, and provenance metadata.

---

## 1. Administrative Hierarchy

Each village in GaunPulse belongs to the formal federal administrative structure of Nepal:
1. **Province (प्रदेश):** One of 7 provinces (Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim).
2. **District (जिल्ला):** Cascading from the selected province (e.g., Sindhupalchok, Mustang, Kaski).
3. **Municipality / Rural Municipality (गाउँपालिका / नगरपालिका):** Formal local government unit.
4. **Ward Number (वडा नं.):** Local ward (1 to 35).

---

## 2. Data Entry Modal Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String (Required) | English village name (e.g. *Bhotenamlang*, *Marpha*) |
| `local_name` | String (Optional) | Devanagari script name (e.g. *भोटेनाम्लाङ*) |
| `province` | Dropdown (Required) | Federal province name |
| `district` | Dropdown (Required) | District name |
| `municipality` | String (Required) | Local government unit |
| `ward_no` | Integer (Required) | Ward number |
| `center_lat` | Decimal (Required) | Latitude in WGS84 format (e.g. `27.8635`) |
| `center_lng` | Decimal (Required) | Longitude in WGS84 format (e.g. `85.5815`) |
| `description` | Text (Optional) | Terrain characteristics, access constraints, hazards |
| `data_source` | String | Source of data (e.g. *Municipal Field Survey*, *OpenStreetMap*) |
| `verification_status` | Enum | `unverified`, `verified`, or `community_endorsed` |

---

## 3. Direct Map Coordinate Selection

Users can set coordinates using three methods:
1. **Search & Pin:** Search a municipality or location, then click `+ Add as New Village`.
2. **Click-to-Pick:** Click `"Pick Coordinates Directly From Map"` to activate crosshair mode, then click anywhere on Nepal's terrain.
3. **Manual Entry:** Enter exact GPS coordinates recorded during field surveys.

---

## 4. API Specification

### Endpoint: `POST /api/villages`

**Headers:**
```http
Content-Type: application/json
Accept: application/json
```

**Payload:**
```json
{
  "name": "Marpha",
  "local_name": "मार्फा",
  "province": "Gandaki Province",
  "district": "Mustang",
  "municipality": "Gharapjhong Rural Municipality",
  "ward_no": "2",
  "center_lat": 28.7516,
  "center_lng": 83.6844,
  "description": "Historic settlement on Kali Gandaki corridor with apple orchards and suspension bridge lifelines.",
  "data_source": "Municipal Planning Office",
  "verification_status": "verified"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "name": "Marpha",
  "local_name": "मार्फा",
  "province": "Gandaki Province",
  "district": "Mustang",
  "municipality": "Gharapjhong Rural Municipality",
  "ward_no": "2",
  "center_lat": 28.7516,
  "center_lng": 83.6844,
  "status": "active",
  "created_at": "2026-11-21T16:00:00.000000Z"
}
```
