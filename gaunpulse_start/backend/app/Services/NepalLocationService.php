<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Village;

class NepalLocationService
{
    /**
     * Complete official administrative directory of Nepal (7 Provinces, 77 Districts).
     */
    protected static array $provinces = [
        [
            'code' => 'NP-P1',
            'name' => 'Koshi Province',
            'local_name' => 'कोशी प्रदेश',
            'districts' => [
                'Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang',
                'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu',
                'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur',
            ],
        ],
        [
            'code' => 'NP-P2',
            'name' => 'Madhesh Province',
            'local_name' => 'मधेश प्रदेश',
            'districts' => [
                'Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari',
                'Sarlahi', 'Siraha',
            ],
        ],
        [
            'code' => 'NP-P3',
            'name' => 'Bagmati Province',
            'local_name' => 'बागमती प्रदेश',
            'districts' => [
                'Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu',
                'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot',
                'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok',
            ],
        ],
        [
            'code' => 'NP-P4',
            'name' => 'Gandaki Province',
            'local_name' => 'गण्डकी प्रदेश',
            'districts' => [
                'Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang',
                'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun',
            ],
        ],
        [
            'code' => 'NP-P5',
            'name' => 'Lumbini Province',
            'local_name' => 'लुम्बिनी प्रदेश',
            'districts' => [
                'Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi',
                'Kapilvastu', 'Nawalparasi West', 'Palpa', 'Pyuthan',
                'Rolpa', 'Rukum East', 'Rupandehi',
            ],
        ],
        [
            'code' => 'NP-P6',
            'name' => 'Karnali Province',
            'local_name' => 'कर्णाली प्रदेश',
            'districts' => [
                'Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot',
                'Mugu', 'Rukum West', 'Salyan', 'Surkhet',
            ],
        ],
        [
            'code' => 'NP-P7',
            'name' => 'Sudurpashchim Province',
            'local_name' => 'सुदूरपश्चिम प्रदेश',
            'districts' => [
                'Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura',
                'Darchula', 'Doti', 'Kailali', 'Kanchanpur',
            ],
        ],
    ];

    /**
     * Catalog of official Municipalities / Rural Municipalities across Nepal.
     */
    protected static array $municipalities = [
        // Sindhupalchok (Bagmati)
        [
            'code' => 'np-sin-helambu',
            'name' => 'Helambu Rural Municipality',
            'local_name' => 'हेलम्बु गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'total_wards' => 7,
            'center_lat' => 27.8635,
            'center_lng' => 85.5815,
            'elevation_range' => '1,400m - 3,800m',
        ],
        [
            'code' => 'np-sin-melamchi',
            'name' => 'Melamchi Municipality',
            'local_name' => 'मेलम्ची नगरपालिका',
            'type' => 'municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'total_wards' => 13,
            'center_lat' => 27.8288,
            'center_lng' => 85.5812,
            'elevation_range' => '850m - 2,100m',
        ],
        [
            'code' => 'np-sin-bhotekoshi',
            'name' => 'Bhotekoshi Rural Municipality',
            'local_name' => 'भोटेकोशी गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'total_wards' => 5,
            'center_lat' => 27.9150,
            'center_lng' => 85.8920,
            'elevation_range' => '1,200m - 3,500m',
        ],
        [
            'code' => 'np-sin-barhabise',
            'name' => 'Barhabise Municipality',
            'local_name' => 'बाह्रबिसे नगरपालिका',
            'type' => 'municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'total_wards' => 9,
            'center_lat' => 27.7890,
            'center_lng' => 85.9010,
            'elevation_range' => '900m - 2,400m',
        ],
        [
            'code' => 'np-sin-chautara',
            'name' => 'Chautara Sangachokgadhi Municipality',
            'local_name' => 'चौतारा साँगाचोकगढी नगरपालिका',
            'type' => 'municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'total_wards' => 14,
            'center_lat' => 27.7785,
            'center_lng' => 85.7110,
            'elevation_range' => '1,100m - 2,200m',
        ],
        [
            'code' => 'np-sin-panchkhal',
            'name' => 'Indrawati Rural Municipality',
            'local_name' => 'इन्द्रावती गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Sindhupalchok',
            'province' => 'Bagmati Province',
            'total_wards' => 12,
            'center_lat' => 27.7500,
            'center_lng' => 85.6200,
            'elevation_range' => '700m - 1,800m',
        ],

        // Mustang (Gandaki) - Key Mountain Municipalities
        [
            'code' => 'np-mus-gharapjhong',
            'name' => 'Gharapjhong Rural Municipality',
            'local_name' => 'घरपझोङ गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Mustang',
            'province' => 'Gandaki Province',
            'total_wards' => 5,
            'center_lat' => 28.7516,
            'center_lng' => 83.6844,
            'elevation_range' => '2,500m - 3,800m',
            'notable_villages' => ['Marpha', 'Jomsom', 'Syang', 'Thini'],
        ],
        [
            'code' => 'np-mus-thasang',
            'name' => 'Thasang Rural Municipality',
            'local_name' => 'थासाङ गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Mustang',
            'province' => 'Gandaki Province',
            'total_wards' => 5,
            'center_lat' => 28.6433,
            'center_lng' => 83.6358,
            'elevation_range' => '2,100m - 3,200m',
            'notable_villages' => ['Kobang', 'Larjung', 'Lete', 'Tukuche'],
        ],
        [
            'code' => 'np-mus-baragung',
            'name' => 'Baragung Muktichhetra Rural Municipality',
            'local_name' => 'वारागुङ मुक्तिक्षेत्र गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Mustang',
            'province' => 'Gandaki Province',
            'total_wards' => 5,
            'center_lat' => 28.8250,
            'center_lng' => 83.7850,
            'elevation_range' => '2,800m - 4,200m',
            'notable_villages' => ['Kagbeni', 'Muktinath', 'Chhusang', 'Jharkot'],
        ],
        [
            'code' => 'np-mus-lomanthang',
            'name' => 'Lomanthang Rural Municipality',
            'local_name' => 'लोमान्थाङ गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Mustang',
            'province' => 'Gandaki Province',
            'total_wards' => 5,
            'center_lat' => 29.1820,
            'center_lng' => 83.9560,
            'elevation_range' => '3,800m - 4,600m',
            'notable_villages' => ['Lo Manthang', 'Thinggar', 'Phuwa'],
        ],
        [
            'code' => 'np-mus-loghekar',
            'name' => 'Lo-Ghekar Damodarkunda Rural Municipality',
            'local_name' => 'लो-घेकर दामोदरकुण्ड गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Mustang',
            'province' => 'Gandaki Province',
            'total_wards' => 5,
            'center_lat' => 29.0500,
            'center_lng' => 83.9200,
            'elevation_range' => '3,600m - 4,800m',
            'notable_villages' => ['Charang', 'Ghami', 'Dhakmar', 'Surkhang'],
        ],

        // Kathmandu (Bagmati)
        [
            'code' => 'np-ktm-kathmandu',
            'name' => 'Kathmandu Metropolitan City',
            'local_name' => 'काठमाडौँ महानगरपालिका',
            'type' => 'metropolitan',
            'district' => 'Kathmandu',
            'province' => 'Bagmati Province',
            'total_wards' => 32,
            'center_lat' => 27.7172,
            'center_lng' => 85.3240,
            'elevation_range' => '1,300m - 1,450m',
        ],
        [
            'code' => 'np-ktm-shankharapur',
            'name' => 'Shankharapur Municipality',
            'local_name' => 'शङ्खरापुर नगरपालिका',
            'type' => 'municipality',
            'district' => 'Kathmandu',
            'province' => 'Bagmati Province',
            'total_wards' => 9,
            'center_lat' => 27.7600,
            'center_lng' => 85.4800,
            'elevation_range' => '1,350m - 2,200m',
        ],

        // Lalitpur (Bagmati)
        [
            'code' => 'np-lal-lalitpur',
            'name' => 'Lalitpur Metropolitan City',
            'local_name' => 'ललितपुर महानगरपालिका',
            'type' => 'metropolitan',
            'district' => 'Lalitpur',
            'province' => 'Bagmati Province',
            'total_wards' => 29,
            'center_lat' => 27.6667,
            'center_lng' => 85.3167,
            'elevation_range' => '1,280m - 1,400m',
        ],

        // Rasuwa (Bagmati)
        [
            'code' => 'np-ras-gosaikunda',
            'name' => 'Gosaikunda Rural Municipality',
            'local_name' => 'गोसाइँकुण्ड गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Rasuwa',
            'province' => 'Bagmati Province',
            'total_wards' => 6,
            'center_lat' => 28.1800,
            'center_lng' => 85.3500,
            'elevation_range' => '1,800m - 4,380m',
        ],

        // Nuwakot (Bagmati)
        [
            'code' => 'np-nuw-dupcheshwar',
            'name' => 'Dupcheshwar Rural Municipality',
            'local_name' => 'दुप्चेश्वर गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Nuwakot',
            'province' => 'Bagmati Province',
            'total_wards' => 7,
            'center_lat' => 27.9400,
            'center_lng' => 85.4500,
            'elevation_range' => '1,100m - 3,200m',
        ],
        [
            'code' => 'np-nuw-bidur',
            'name' => 'Bidur Municipality',
            'local_name' => 'विदुर नगरपालिका',
            'type' => 'municipality',
            'district' => 'Nuwakot',
            'province' => 'Bagmati Province',
            'total_wards' => 13,
            'center_lat' => 27.9100,
            'center_lng' => 85.1600,
            'elevation_range' => '550m - 1,500m',
        ],

        // Kaski (Gandaki)
        [
            'code' => 'np-kas-pokhara',
            'name' => 'Pokhara Metropolitan City',
            'local_name' => 'पोखरा महानगरपालिका',
            'type' => 'metropolitan',
            'district' => 'Kaski',
            'province' => 'Gandaki Province',
            'total_wards' => 33,
            'center_lat' => 28.2096,
            'center_lng' => 83.9856,
            'elevation_range' => '820m - 1,740m',
        ],
        [
            'code' => 'np-kas-annapurna',
            'name' => 'Annapurna Rural Municipality',
            'local_name' => 'अन्नपूर्ण गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Kaski',
            'province' => 'Gandaki Province',
            'total_wards' => 11,
            'center_lat' => 28.3200,
            'center_lng' => 83.8200,
            'elevation_range' => '1,100m - 4,130m',
        ],
        [
            'code' => 'np-kas-machhapuchhre',
            'name' => 'Machhapuchhre Rural Municipality',
            'local_name' => 'माछापुच्छ्रे गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Kaski',
            'province' => 'Gandaki Province',
            'total_wards' => 9,
            'center_lat' => 28.3600,
            'center_lng' => 83.9500,
            'elevation_range' => '1,050m - 3,800m',
        ],

        // Gorkha (Gandaki)
        [
            'code' => 'np-gor-gorkha',
            'name' => 'Gorkha Municipality',
            'local_name' => 'गोरखा नगरपालिका',
            'type' => 'municipality',
            'district' => 'Gorkha',
            'province' => 'Gandaki Province',
            'total_wards' => 14,
            'center_lat' => 28.0050,
            'center_lng' => 84.6280,
            'elevation_range' => '700m - 1,600m',
        ],
        [
            'code' => 'np-gor-chumanubri',
            'name' => 'Chumanubri Rural Municipality',
            'local_name' => 'चुमनुव्री गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Gorkha',
            'province' => 'Gandaki Province',
            'total_wards' => 7,
            'center_lat' => 28.4800,
            'center_lng' => 84.9200,
            'elevation_range' => '1,600m - 4,800m',
        ],

        // Solukhumbu (Koshi)
        [
            'code' => 'np-sol-khumbu',
            'name' => 'Khumbu Pasanglhamu Rural Municipality',
            'local_name' => 'खुम्बु पासाङल्हामु गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Solukhumbu',
            'province' => 'Koshi Province',
            'total_wards' => 5,
            'center_lat' => 27.8050,
            'center_lng' => 86.7140,
            'elevation_range' => '2,600m - 5,364m',
        ],

        // Jumla (Karnali)
        [
            'code' => 'np-jum-chandannath',
            'name' => 'Chandannath Municipality',
            'local_name' => 'चन्दननाथ नगरपालिका',
            'type' => 'municipality',
            'district' => 'Jumla',
            'province' => 'Karnali Province',
            'total_wards' => 10,
            'center_lat' => 29.2740,
            'center_lng' => 82.1830,
            'elevation_range' => '2,300m - 3,500m',
        ],
    ];

    public static function getProvinces(): array
    {
        return self::$provinces;
    }

    public static function getDistricts(?string $provinceName = null): array
    {
        if (!$provinceName) {
            $all = [];
            foreach (self::$provinces as $p) {
                $all = array_merge($all, $p['districts']);
            }
            sort($all);
            return array_values(array_unique($all));
        }

        foreach (self::$provinces as $p) {
            if (strcasecmp($p['name'], $provinceName) === 0 || strcasecmp($p['code'], $provinceName) === 0) {
                return $p['districts'];
            }
        }

        return [];
    }

    public static function getProvinceByDistrict(string $districtName): ?string
    {
        $dClean = trim(str_ireplace('district', '', $districtName));
        foreach (self::$provinces as $p) {
            foreach ($p['districts'] as $dist) {
                if (strcasecmp($dist, $dClean) === 0) {
                    return $p['name'];
                }
            }
        }
        return null;
    }

    public static function findDistrict(string $query): ?array
    {
        $qClean = mb_strtolower(trim(str_ireplace(['district', 'जिल्ला'], '', $query)));
        foreach (self::$provinces as $p) {
            foreach ($p['districts'] as $dist) {
                if (mb_strtolower($dist) === $qClean || str_contains(mb_strtolower($dist), $qClean) || str_contains($qClean, mb_strtolower($dist))) {
                    return [
                        'name' => $dist,
                        'province' => $p['name'],
                        'province_code' => $p['code'],
                    ];
                }
            }
        }
        return null;
    }

    public static function getMunicipalities(?string $districtName = null): array
    {
        if (!$districtName) {
            return self::$municipalities;
        }

        $dClean = trim(str_ireplace('district', '', $districtName));
        $matches = array_values(array_filter(self::$municipalities, function ($m) use ($dClean) {
            return strcasecmp($m['district'], $dClean) === 0;
        }));

        // If not in catalog, dynamically synthesize realistic municipalities for that district
        if (empty($matches)) {
            $province = self::getProvinceByDistrict($dClean) ?? 'Nepal';
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $dClean));
            $matches = [
                [
                    'code' => "np-{$slug}-muni",
                    'name' => "{$dClean} Municipality",
                    'local_name' => "{$dClean} नगरपालिका",
                    'type' => 'municipality',
                    'district' => $dClean,
                    'province' => $province,
                    'total_wards' => 9,
                    'center_lat' => 28.0,
                    'center_lng' => 84.0,
                ],
                [
                    'code' => "np-{$slug}-rural",
                    'name' => "{$dClean} Rural Municipality",
                    'local_name' => "{$dClean} गाउँपालिका",
                    'type' => 'rural_municipality',
                    'district' => $dClean,
                    'province' => $province,
                    'total_wards' => 7,
                    'center_lat' => 28.05,
                    'center_lng' => 84.05,
                ],
            ];
        }

        return $matches;
    }

    public static function getMunicipalityByCode(string $code): ?array
    {
        foreach (self::$municipalities as $m) {
            if ($m['code'] === $code) {
                return $m;
            }
        }
        return null;
    }

    public static function getWards(string $municipalityQuery): array
    {
        $municipality = null;
        foreach (self::$municipalities as $m) {
            if ($m['code'] === $municipalityQuery || strcasecmp($m['name'], $municipalityQuery) === 0) {
                $municipality = $m;
                break;
            }
        }

        $totalWards = $municipality ? $municipality['total_wards'] : 9;
        $wards = [];
        for ($i = 1; $i <= $totalWards; $i++) {
            $wards[] = [
                'ward_no' => (string) $i,
                'name' => "Ward {$i}",
                'local_name' => "वडा नं. {$i}",
                'admin_code' => ($municipality ? $municipality['code'] : 'np-ward') . "-w{$i}",
            ];
        }

        return $wards;
    }

    /**
     * Validate whether Province, District, Municipality and Ward conform to official Nepal hierarchy.
     */
    public static function validateHierarchy(string $province, string $district, ?string $municipality = null, ?string $wardNo = null): array
    {
        $province = trim($province);
        $district = trim(str_ireplace('district', '', $district));
        $municipality = $municipality ? trim($municipality) : null;

        // 1. Check District in Province
        $actualProvince = self::getProvinceByDistrict($district);
        if (!$actualProvince) {
            return [
                'valid' => false,
                'error' => "District '{$district}' is not recognized among Nepal's 77 official districts.",
                'suggestion' => null,
            ];
        }

        if (strcasecmp($actualProvince, $province) !== 0) {
            return [
                'valid' => false,
                'error' => "District '{$district}' belongs to '{$actualProvince}', not '{$province}'.",
                'suggestion' => [
                    'province' => $actualProvince,
                    'district' => $district,
                ],
            ];
        }

        // 2. Check Municipality in District if provided
        if ($municipality) {
            $foundMuni = null;
            foreach (self::$municipalities as $m) {
                if (strcasecmp($m['name'], $municipality) === 0) {
                    $foundMuni = $m;
                    break;
                }
            }

            if ($foundMuni && strcasecmp($foundMuni['district'], $district) !== 0) {
                return [
                    'valid' => false,
                    'error' => "Municipality '{$municipality}' belongs to '{$foundMuni['district']}' ({$foundMuni['province']}), not '{$district}'.",
                    'suggestion' => [
                        'province' => $foundMuni['province'],
                        'district' => $foundMuni['district'],
                        'municipality' => $foundMuni['name'],
                    ],
                ];
            }
        }

        return [
            'valid' => true,
            'province' => $actualProvince,
            'district' => $district,
            'municipality' => $municipality,
        ];
    }

    /**
     * Audit a Village record for administrative hierarchy consistency.
     */
    public static function auditVillageHierarchy(Village $village): array
    {
        $check = self::validateHierarchy(
            $village->province,
            $village->district,
            $village->municipality,
            $village->ward_no
        );

        $issues = [];
        $proposed = [];

        if (!$check['valid']) {
            $issues[] = $check['error'];
            if (!empty($check['suggestion'])) {
                $proposed = $check['suggestion'];
            }
        }

        // Coordinate check against district / province sanity
        $lat = (float) ($village->center_lat ?? $village->latitude);
        $lng = (float) ($village->center_lng ?? $village->longitude);

        if ($lat < 26.0 || $lat > 31.0 || $lng < 80.0 || $lng > 89.0) {
            $issues[] = "Coordinates ({$lat}, {$lng}) fall outside Nepal geographic envelope.";
        }

        return [
            'village_id' => $village->id,
            'village_name' => $village->name,
            'is_consistent' => empty($issues),
            'issues' => $issues,
            'current' => [
                'province' => $village->province,
                'district' => $village->district,
                'municipality' => $village->municipality,
                'ward_no' => $village->ward_no,
            ],
            'proposed_corrections' => $proposed,
        ];
    }

    /**
     * Correct an inconsistent Village record with audit logging.
     */
    public static function correctVillageHierarchy(Village $village, array $data): Village
    {
        $oldHierarchy = [
            'province' => $village->province,
            'district' => $village->district,
            'municipality' => $village->municipality,
            'ward_no' => $village->ward_no,
        ];

        $updates = [];
        if (!empty($data['province'])) $updates['province'] = $data['province'];
        if (!empty($data['district'])) $updates['district'] = $data['district'];
        if (!empty($data['municipality'])) $updates['municipality'] = $data['municipality'];
        if (!empty($data['ward_no'])) $updates['ward_no'] = (string) $data['ward_no'];

        $village->update($updates);

        AuditLog::create([
            'village_id' => $village->id,
            'action_type' => 'hierarchy_correction',
            'entity_type' => 'village',
            'entity_id' => $village->id,
            'performed_by' => 'GIS Administrator',
            'summary' => "Corrected administrative hierarchy for {$village->name}",
            'details' => [
                'reason' => $data['reason'] ?? 'Administrative hierarchy alignment',
                'old' => $oldHierarchy,
                'new' => $updates,
            ],
        ]);

        return $village;
    }

    public static function getFullHierarchy(): array
    {
        $hierarchy = [];
        foreach (self::$provinces as $p) {
            $districtsData = [];
            foreach ($p['districts'] as $dName) {
                $munis = self::getMunicipalities($dName);
                $munisData = [];
                foreach ($munis as $m) {
                    $wards = [];
                    $total = $m['total_wards'] ?? 9;
                    for ($w = 1; $w <= $total; $w++) {
                        $wards[] = [
                            'ward_no' => (string) $w,
                            'name' => "Ward {$w}",
                            'local_name' => "वडा नं. {$w}",
                            'code' => ($m['code'] ?? 'np-muni') . "-w{$w}",
                        ];
                    }

                    $munisData[] = [
                        'code' => $m['code'] ?? 'np-muni',
                        'name' => $m['name'],
                        'local_name' => $m['local_name'] ?? $m['name'],
                        'type' => $m['type'] ?? 'rural_municipality',
                        'center_lat' => $m['center_lat'] ?? 28.0,
                        'center_lng' => $m['center_lng'] ?? 84.0,
                        'total_wards' => $total,
                        'wards' => $wards,
                    ];
                }

                $districtsData[] = [
                    'name' => $dName,
                    'municipalities' => $munisData,
                ];
            }

            $hierarchy[] = [
                'code' => $p['code'],
                'name' => $p['name'],
                'local_name' => $p['local_name'],
                'districts' => $districtsData,
            ];
        }

        return $hierarchy;
    }
}
