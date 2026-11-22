<?php

namespace App\Http\Controllers;

use App\Models\Village;
use App\Services\NepalLocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class LocationController extends Controller
{
    public function hierarchy()
    {
        return response()->json(NepalLocationService::getFullHierarchy());
    }

    public function provinces()
    {
        return response()->json(NepalLocationService::getProvinces());
    }

    public function districts(Request $request)
    {
        $province = $request->query('province');
        return response()->json(NepalLocationService::getDistricts($province));
    }

    public function municipalities(Request $request)
    {
        $district = $request->query('district');
        return response()->json(NepalLocationService::getMunicipalities($district));
    }

    public function wards(Request $request)
    {
        $municipality = $request->query('municipality', 'Helambu Rural Municipality');
        return response()->json(NepalLocationService::getWards($municipality));
    }

    /**
     * Search any village, municipality, district, or place across Nepal.
     */
    public function search(Request $request)
    {
        $query = trim($request->query('q', ''));
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];
        $seen = [];

        // 1. Search MySQL registered villages first
        $savedVillages = Village::query()
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('district', 'LIKE', "%{$query}%")
            ->orWhere('municipality', 'LIKE', "%{$query}%")
            ->limit(6)
            ->get();

        foreach ($savedVillages as $v) {
            $key = "saved-village-{$v->id}";
            $seen[$key] = true;
            $results[] = [
                'id' => $v->id,
                'title' => $v->name,
                'subtitle' => "Registered Village · Ward {$v->ward_no}, {$v->municipality}, {$v->district}",
                'type' => 'saved_village',
                'lat' => (float) ($v->center_lat ?? $v->latitude ?? 27.8635),
                'lng' => (float) ($v->center_lng ?? $v->longitude ?? 85.5815),
                'zoom' => 14,
                'province' => $v->province,
                'district' => $v->district,
                'municipality' => $v->municipality,
                'ward_no' => $v->ward_no,
                'is_registered' => true,
            ];
        }

        // 2. Search Nepal Administrative hierarchy (Municipalities & Districts)
        $qLower = mb_strtolower($query);
        $munis = NepalLocationService::getMunicipalities();
        foreach ($munis as $m) {
            if (str_contains(mb_strtolower($m['name']), $qLower) ||
                (isset($m['local_name']) && str_contains(mb_strtolower($m['local_name']), $qLower)) ||
                (isset($m['district']) && str_contains(mb_strtolower($m['district']), $qLower))) {

                $key = "muni-" . ($m['code'] ?? $m['name']);
                if (!isset($seen[$key])) {
                    $seen[$key] = true;
                    $results[] = [
                        'title' => $m['name'],
                        'local_name' => $m['local_name'] ?? null,
                        'subtitle' => ($m['type'] === 'rural_municipality' ? 'Rural Municipality' : 'Municipality') . " · {$m['district']} ({$m['province']})",
                        'type' => 'municipality',
                        'lat' => (float) ($m['center_lat'] ?? 27.8635),
                        'lng' => (float) ($m['center_lng'] ?? 85.5815),
                        'zoom' => 13,
                        'province' => $m['province'],
                        'district' => $m['district'],
                        'municipality' => $m['name'],
                        'is_registered' => false,
                    ];
                }
            }
        }

        // 3. Search Districts
        $provinces = NepalLocationService::getProvinces();
        foreach ($provinces as $p) {
            foreach ($p['districts'] as $distName) {
                if (str_contains(mb_strtolower($distName), $qLower)) {
                    $key = "district-{$distName}";
                    if (!isset($seen[$key])) {
                        $seen[$key] = true;
                        $dMunis = NepalLocationService::getMunicipalities($distName);
                        $dCenter = NepalLocationService::getDistrictCenter($distName);
                        $dLat = $dCenter ? $dCenter['lat'] : (!empty($dMunis[0]['center_lat']) ? (float)$dMunis[0]['center_lat'] : 27.7172);
                        $dLng = $dCenter ? $dCenter['lng'] : (!empty($dMunis[0]['center_lng']) ? (float)$dMunis[0]['center_lng'] : 85.3240);
                        $results[] = [
                            'title' => "{$distName} District",
                            'subtitle' => "District · {$p['name']}",
                            'type' => 'district',
                            'lat' => $dLat,
                            'lng' => $dLng,
                            'zoom' => 10,
                            'province' => $p['name'],
                            'district' => $distName,
                            'municipality' => !empty($dMunis[0]['name']) ? $dMunis[0]['name'] : '',
                            'is_registered' => false,
                        ];
                    }
                }
            }
        }

        // 4. Fallback: If results < 8, query Nominatim with caching
        if (count($results) < 8) {
            $cacheKey = 'nepal_geo_search_' . md5(mb_strtolower($query));
            $osmResults = Cache::remember($cacheKey, 86400, function () use ($query) {
                try {
                    $response = Http::withHeaders([
                        'User-Agent' => 'GaunPulse-Nepal-Intelligence/1.0 (contact@gaunpulse.gov.np)',
                    ])->timeout(3.5)->get('https://nominatim.openstreetmap.org/search', [
                        'q' => $query,
                        'countrycodes' => 'np',
                        'format' => 'json',
                        'addressdetails' => 1,
                        'limit' => 5,
                    ]);

                    if ($response->successful()) {
                        return $response->json();
                    }
                } catch (\Throwable $e) {
                    // Silently fail if external network down or timeout
                }
                return [];
            });

            if (is_array($osmResults)) {
                foreach ($osmResults as $item) {
                    $name = $item['name'] ?? explode(',', $item['display_name'])[0];
                    $addr = $item['address'] ?? [];
                    $rawDistrict = $addr['county'] ?? $addr['district'] ?? '';
                    $rawMuni = $addr['city'] ?? $addr['town'] ?? $addr['municipality'] ?? $addr['village'] ?? '';

                    // Match against official Nepal 77 districts
                    $matchedDistrict = null;
                    if ($rawDistrict) {
                        $matchedDistrict = NepalLocationService::findDistrict($rawDistrict);
                    }
                    if (!$matchedDistrict && isset($item['display_name'])) {
                        $tokens = explode(',', $item['display_name']);
                        foreach ($tokens as $tok) {
                            $d = NepalLocationService::findDistrict(trim($tok));
                            if ($d) {
                                $matchedDistrict = $d;
                                break;
                            }
                        }
                    }

                    $finalDistrict = $matchedDistrict ? $matchedDistrict['name'] : ($rawDistrict ?: 'Sindhupalchok');
                    $finalProvince = $matchedDistrict ? $matchedDistrict['province'] : (NepalLocationService::getProvinceByDistrict($finalDistrict) ?: 'Bagmati Province');

                    $finalMuni = $rawMuni;
                    if (!$finalMuni || !empty($matchedDistrict)) {
                        $munis = NepalLocationService::getMunicipalities($finalDistrict);
                        // Check if any municipality name appears in display_name
                        $disp = $item['display_name'] ?? '';
                        $foundSpecificMuni = null;
                        foreach ($munis as $m) {
                            if (stripos($disp, $m['name']) !== false || (isset($m['local_name']) && mb_stripos($disp, $m['local_name']) !== false)) {
                                $foundSpecificMuni = $m['name'];
                                break;
                            }
                        }
                        $finalMuni = $foundSpecificMuni ?: (!empty($munis[0]['name']) ? $munis[0]['name'] : "{$finalDistrict} Rural Municipality");
                    }

                    $key = "osm-" . ($item['place_id'] ?? md5($name . $item['lat']));
                    if (!isset($seen[$key])) {
                        $seen[$key] = true;
                        $results[] = [
                            'title' => $name,
                            'subtitle' => $item['display_name'],
                            'type' => 'osm_place',
                            'lat' => (float) $item['lat'],
                            'lng' => (float) $item['lon'],
                            'zoom' => 13,
                            'province' => $finalProvince,
                            'district' => $finalDistrict,
                            'municipality' => $finalMuni,
                            'is_registered' => false,
                        ];
                    }
                }
            }
        }

        return response()->json(array_slice($results, 0, 12));
    }
}
