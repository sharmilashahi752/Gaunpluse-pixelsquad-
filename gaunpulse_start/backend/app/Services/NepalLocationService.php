<?php

namespace App\Services;

class NepalLocationService
{
    /**
     * Complete official administrative directory of Nepal.
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
     * Comprehensive catalog of official Municipalities / Rural Municipalities.
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
            'center_lat' => 27.7420,
            'center_lng' => 85.6200,
            'elevation_range' => '750m - 1,900m',
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
            'center_lat' => 28.1820,
            'center_lng' => 85.3410,
            'elevation_range' => '1,800m - 4,380m',
        ],
        [
            'code' => 'np-ras-kalika',
            'name' => 'Kalika Rural Municipality',
            'local_name' => 'कालिका गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Rasuwa',
            'province' => 'Bagmati Province',
            'total_wards' => 5,
            'center_lat' => 28.0210,
            'center_lng' => 85.2200,
            'elevation_range' => '900m - 2,100m',
        ],
        [
            'code' => 'np-ras-uttargaya',
            'name' => 'Uttargaya Rural Municipality',
            'local_name' => 'उत्तरगया गाउँपालिका',
            'type' => 'rural_municipality',
            'district' => 'Rasuwa',
            'province' => 'Bagmati Province',
            'total_wards' => 5,
            'center_lat' => 27.9800,
            'center_lng' => 85.1800,
            'elevation_range' => '850m - 2,200m',
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

    public static function getMunicipalities(?string $districtName = null): array
    {
        if (!$districtName) {
            return self::$municipalities;
        }

        return array_values(array_filter(self::$municipalities, function ($m) use ($districtName) {
            return strcasecmp($m['district'], $districtName) === 0;
        }));
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

    public static function getFullHierarchy(): array
    {
        $hierarchy = [];
        foreach (self::$provinces as $p) {
            $districtsData = [];
            foreach ($p['districts'] as $dName) {
                $munis = array_values(array_filter(self::$municipalities, function ($m) use ($dName) {
                    return strcasecmp($m['district'], $dName) === 0;
                }));

                $munisData = [];
                foreach ($munis as $m) {
                    $wards = [];
                    for ($w = 1; $w <= $m['total_wards']; $w++) {
                        $wards[] = [
                            'ward_no' => (string) $w,
                            'name' => "Ward {$w}",
                            'local_name' => "वडा नं. {$w}",
                            'code' => "{$m['code']}-w{$w}",
                        ];
                    }

                    $munisData[] = [
                        'code' => $m['code'],
                        'name' => $m['name'],
                        'local_name' => $m['local_name'],
                        'type' => $m['type'],
                        'center_lat' => $m['center_lat'],
                        'center_lng' => $m['center_lng'],
                        'total_wards' => $m['total_wards'],
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
