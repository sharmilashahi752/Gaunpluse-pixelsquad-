# GAUNPULSE — NEPAL NATIONAL LOCATION DIRECTORY & ADMINISTRATIVE HIERARCHY

**Document Reference:** `docs/NEPAL_LOCATION_DIRECTORY.md`  
**Platform:** GaunPulse — The Village That Speaks  
**Scope:** 7 Provinces, 77 Districts, 753 Local Municipalities, and Ward-level Settlements

---

## 1. Directory Structure & Administrative Design

Nepal is organized into three levels of federal governance: Federal, Provincial (7 Provinces), and Local (753 Municipalities/Rural Municipalities). Previous rural tech prototypes broke when attempting to hardcode municipality boundaries or when restricting users to a single test municipality.

GaunPulse implements an authentic, non-destructive administrative catalog in `NepalLocationService.php` that adheres to official boundaries:

```
Nepal (Federal)
  ├── 7 Provinces (Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim)
        ├── 77 Districts (e.g., Dailekh, Sindhupalchok, Kaski, Kathmandu, Kailali, Morang)
              ├── 753 Municipalities & Rural Municipalities (गाउँपालिका / नगरपालिका)
                    ├── Wards (वडा नं. १ देखि ३३ सम्म)
                          ├── Registered Villages (आधिकारिक गाउँ)
                          └── Unregistered Settlements / Toles (दर्ता नभएका बस्तीहरू)
```

---

## 2. Province & District Directory (Exhaustive 77-District Coverage)

| Province Number & Name | Total Districts | Key Districts Cataloged |
| :--- | :---: | :--- |
| **Province 1: Koshi** | 14 | Morang, Sunsari, Jhapa, Ilam, Dhankuta, Bhojpur, Sankhuwasabha, Solukhumbu, Okhaldhunga, Khotang, Udayapur, Taplejung, Panchthar, Terhathum |
| **Province 2: Madhesh** | 8 | Saptari, Siraha, Dhanusha, Mahottari, Sarlahi, Rautahat, Bara, Parsa |
| **Province 3: Bagmati** | 13 | Sindhupalchok (Helambu, Melamchi), Kathmandu, Lalitpur, Bhaktapur, Kavrepalanchok, Nuwakot, Rasuwa, Dhading, Makwanpur, Chitwan, Ramechhap, Dolakha, Sindhuli |
| **Province 4: Gandaki** | 11 | Kaski (Pokhara), Gorkha, Lamjung, Tanahun, Syangja, Parbat, Baglung, Myagdi, Mustang, Manang, Nawalpur |
| **Province 5: Lumbini** | 12 | Rupandehi (Butwal), Kapilvastu, Palpa, Arghakhanchi, Gulmi, Dang, Banke (Nepalgunj), Bardiya, Pyuthan, Rolpa, Eastern Rukum, Parasi |
| **Province 6: Karnali** | 10 | Dailekh (Mahabu, Narayan, Dullu), Surkhet (Birendranagar), Jumla, Kalikot, Mugu, Humla, Dolpa, Jajarkot, Western Rukum, Salyan |
| **Province 7: Sudurpashchim** | 9 | Kailali (Dhangadhi), Kanchanpur, Dadeldhura, Baitadi, Darchula, Doti, Achham, Bajhang, Bajura |

---

## 3. Dynamic Municipality Resolution (`NepalLocationService`)

To prevent database bloating and foreign key violations while allowing immediate nationwide coverage:
1. **Catalog Lookup:** `NepalLocationService::findMunicipality($identifier)` resolves municipalities by either:
   - Primary key (`id`)
   - Unique code (`helambu-bagmati`, `mahabu-karnali`, `pokhara-gandaki`)
   - Official English name (`Helambu Rural Municipality`, `Mahabu Rural Municipality`)
   - Official Nepali name (`हेलम्बु गाउँपालिका`, `महाबु गाउँपालिका`)
2. **On-Demand Record Materialization:** If a citizen selects or enters a valid national municipality that has not yet been registered in the local MySQL `municipalities` table, `resolveOrCreateMunicipalityRecord()` creates a verified municipal record with official centroid coordinates and ward count seamlessly.
3. **Preservation of Existing Data:** Pre-existing village and municipality records are never overwritten or deleted.

---

## 4. Handling Unregistered Settlements (बस्ती / टोल)

A major flaw in traditional government reporting systems is the strict constraint that a citizen can only report an issue if their village name is pre-registered in the database. In remote mountainous areas, micro-settlements (Toles) may not exist in official GIS shapefiles.

### The GaunPulse Zero-Bloat Solution:
* **Citizen Experience:** If a ward has no cataloged village, or the citizen belongs to an unlisted tole, the interface displays `+ Other / Unregistered Settlement` and provides a required `Settlement / Tole Name *` input.
* **Database Representation:**
  - `issues.village_id` is kept `NULL`.
  - `issues.settlement_name` stores the citizen-reported tole name (e.g. *"Besi Tole"*).
  - Unregistered settlements **do not create fake `villages` records**, preventing GIS clutter.
* **Admin Verification Workflow:**
  - Municipal engineers reviewing the report see the citizen-entered settlement name.
  - During verification, the engineer can link the settlement to an official nearby village or create a verified GIS village record with a single click.

---

## 5. Draggable Leaflet GIS Map & GPS Geolocation

* **Custom Leaflet DivIcon:** Standard Leaflet pins frequently trigger `404 Not Found` for `marker-icon.png` in Vite production builds. GaunPulse uses an inline SVG divIcon with dynamic center-anchored geometry.
* **Draggable Pin:** Citizens can tap anywhere on the map or drag the pin directly onto the damaged infrastructure.
* **Permission-Handled Geolocation:** The *"Use My Current Location"* button explicitly requests GPS permission via `navigator.geolocation.getCurrentPosition`. If denied, it displays a polite fallback message explaining that manual map tapping remains fully available.
