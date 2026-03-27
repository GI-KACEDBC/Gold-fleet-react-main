<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GeocodingController extends Controller
{
    /**
     * Geocode a location string to coordinates
     * This proxies requests to Nominatim to avoid CORS issues
     */
    public function geocode(Request $request)
    {
        try {
            $validated = $request->validate([
                'location' => 'required|string|max:255',
            ]);

            $location = $validated['location'];
            \Log::info('[GEOCODE] Search requested for: ' . $location);

            // Cache results for 24 hours to reduce API calls
            $cacheKey = 'geocoding_' . md5(strtolower($location));
            
            $result = Cache::remember($cacheKey, 86400, function () use ($location) {
                try {
                    \Log::info('[NOMINATIM] Calling API for: ' . $location);
                    
                    $response = Http::timeout(10)
                        ->withHeaders([
                            'Accept' => 'application/json',
                            'User-Agent' => 'Gold-Fleet-Application/1.0 (Fleet Management System)', // ✅ REQUIRED by Nominatim
                        ])
                        ->get('https://nominatim.openstreetmap.org/search', [
                            'format' => 'json',
                            'q' => $location,
                            'limit' => 10, // Increased to 10 for better results
                            'countrycodes' => 'gh', // Focus on Ghana
                            'addressdetails' => 1,
                        ]);

                    \Log::info('[NOMINATIM] Response status: ' . $response->status());
                    
                    if ($response->successful()) {
                        $data = $response->json();
                        \Log::info('[NOMINATIM] Got ' . count($data) . ' results for: ' . $location);
                        
                        if (!empty($data) && is_array($data)) {
                            $results = array_map(function ($item) {
                                return [
                                    'name' => $item['display_name'] ?? $item['name'] ?? 'Unknown',
                                    'lat' => (float) $item['lat'],
                                    'lon' => (float) $item['lon'],
                                    'type' => $item['type'] ?? 'location',
                                ];
                            }, $data);
                            
                            \Log::info('[GEOCODE] Success: returning ' . count($results) . ' results');
                            return [
                                'success' => true,
                                'data' => $results,
                            ];
                        }

                        \Log::warning('[NOMINATIM] No data returned for: ' . $location);
                        return [
                            'success' => true,
                            'data' => [],
                        ];
                    }

                    \Log::error('[NOMINATIM] API returned status ' . $response->status() . ' for: ' . $location);
                    return [
                        'success' => false,
                        'message' => 'Geocoding service returned status ' . $response->status(),
                        'data' => [],
                    ];
                } catch (\Exception $e) {
                    \Log::error('[GEOCODE] Exception: ' . $e->getMessage());
                    return [
                        'success' => false,
                        'message' => 'Error: ' . $e->getMessage(),
                        'data' => [],
                    ];
                }
            });

            return response()->json($result);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Reverse geocode coordinates to location name
     */
    public function reverseGeocode(Request $request)
    {
        try {
            $validated = $request->validate([
                'lat' => 'required|numeric|between:-90,90',
                'lon' => 'required|numeric|between:-180,180',
            ]);

            // Cache results for 24 hours
            $cacheKey = 'reverse_geocoding_' . md5($validated['lat'] . '_' . $validated['lon']);
            
            $result = Cache::remember($cacheKey, 86400, function () use ($validated) {
                try {
                    $response = Http::timeout(10)
                        ->withHeaders([
                            'Accept' => 'application/json',
                            'User-Agent' => 'Gold-Fleet-Application/1.0 (Fleet Management System)',
                        ])
                        ->get('https://nominatim.openstreetmap.org/reverse', [
                            'format' => 'json',
                            'lat' => $validated['lat'],
                            'lon' => $validated['lon'],
                        ]);

                    if ($response->successful()) {
                        $data = $response->json();
                        
                        return [
                            'success' => true,
                            'data' => [
                                'name' => $data['address']['city'] 
                                    ?? $data['address']['county'] 
                                    ?? $data['display_name'] 
                                    ?? 'Unknown Location',
                                'lat' => (float) $validated['lat'],
                                'lon' => (float) $validated['lon'],
                            ],
                        ];
                    }

                    return [
                        'success' => false,
                        'message' => 'Geocoding service unavailable',
                    ];
                } catch (\Exception $e) {
                    \Log::error('Reverse geocoding error: ' . $e->getMessage());
                    return [
                        'success' => false,
                        'message' => 'Error reverse geocoding location',
                    ];
                }
            });

            return response()->json($result);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
