# GaunPulse — Data Sources, Administrative Codes & Attribution

This document details the official data sources, licensing, and geographic authority references integrated into **GaunPulse**.

---

## 1. Official Administrative Boundaries

The administrative location hierarchy (Province → District → Municipality/Rural Municipality → Ward) adheres strictly to the official constitutional structure defined by the **Government of Nepal**:

- **Authority**: Ministry of Federal Affairs and General Administration (MoFAGA) & Survey Department of Nepal (Napi Bibhag).
- **Administrative Levels**:
  - **Level 1**: 7 Provinces (`NP-P1` to `NP-P7`).
  - **Level 2**: 77 Districts.
  - **Level 3**: 753 Local Levels (Metropolitan Cities, Sub-Metropolitan Cities, Municipalities, and Rural Municipalities / गाउँपालिका).
  - **Level 4**: 6,743 Wards.

### Geographic Identifier Scheme
- Province: `NP-P[1-7]` (e.g. `NP-P3` for Bagmati Province)
- Local Level: `np-[dist]-[muni]` (e.g. `np-sin-helambu` for Helambu Rural Municipality)
- Ward Level: `[muni_code]-w[1-9]` (e.g. `np-sin-helambu-w4`)

---

## 2. Demographic & Census Baselines

- **Authority**: National Statistics Office (NSO) Nepal (formerly Central Bureau of Statistics - CBS).
- **Dataset**: National Population and Housing Census 2021 (NPHC 2021).
- **Attributes Tracked**:
  - Total Ward Population (`population`)
  - Total Residential Households (`households`)
  - Settlement-level household estimates
- **Attribution Rule**: Every onboarded village record stores `data_source` and `reference_year` to guarantee transparency and prevent simulated data from being mistaken for official municipal census figures.

---

## 3. OpenStreetMap Data Licensing

- **Provider**: OpenStreetMap Foundation (OSMF) / Overpass API.
- **License**: Open Database License (ODbL 1.0).
- **Attribution Statement**:
  > *"Contains geographic data © OpenStreetMap contributors, licensed under the Open Database License (ODbL)."*
- **Usage Policy**: GaunPulse tags every ingested road and amenity with `source: 'osm'` and preserves original OSM Node and Way IDs (`osm:way:...`).

---

## 4. Verification Tiers & Confidence Indicators

To distinguish raw imported data from field-surveyed records, GaunPulse enforces 5 verification statuses:

1. **`verified`**: Inspected and verified by an authorized municipal road engineer or GIS officer (Confidence: 90% - 100%).
2. **`pending_review`**: Submitted by field enumerators or community leaders, awaiting official review (Confidence: 75% - 85%).
3. **`imported`**: Ingested automatically from GeoJSON, CSV, or OSM; unchecked on the ground (Confidence: 65% - 75%).
4. **`unverified`**: Legacy or crowdsourced waypoint without formal corroboration (Confidence: < 60%).
5. **`rejected`**: Disproved or obsolete spatial geometry flagged by inspectors.
