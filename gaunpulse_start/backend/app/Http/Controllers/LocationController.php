<?php

namespace App\Http\Controllers;

use App\Services\NepalLocationService;
use Illuminate\Http\Request;

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
}
