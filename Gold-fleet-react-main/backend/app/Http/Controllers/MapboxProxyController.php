<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class MapboxProxyController extends Controller
{
    /**
     * Proxy Mapbox Geocoding API requests
     * This keeps the API token secure on the server
     */
    public function geocode(Request $request)
    {
        try {
            $validated = $request->validate([
                'q' => 'required|string|max:255',
            ]);

            $query = $validated['q'];
            $token = config('services.mapbox.secret');

            if (!$token) {
                \Log::warning('[Mapbox] API token not configured in .env');
                return response()->json([
                    'success' => false,
                    'message' => 'Mapbox API not configured',
                    'features' => [],
                ], 503);
            }

            \Log::info('[Mapbox] Search requested for: ' . $query);

            // Cache results for 24 hours to reduce API calls
            $cacheKey = 'mapbox_geocoding_' . md5(strtolower($query));
            
            $result = Cache::remember($cacheKey, 86400, function () use ($query, $token) {
                try {
                    \Log::info('[Mapbox API] Calling Mapbox Geocoding for: ' . $query);
                    
                    // Build URL with parameters
                    $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" . urlencode($query) . ".json";
                    
                    $response = Http::timeout(10)
                        ->get($url, [
                            'access_token' => $token,
                            'limit' => 5, // Limit to 5 results
                            'country' => 'gh', // Focus on Ghana
                            'types' => 'place,address,poi', // Include various types
                        ]);

                    \Log::info('[Mapbox API] Response status: ' . $response->status());
                    
                    if ($response->successful()) {
                        $data = $response->json();
                        
                        // Mapbox returns features array with center coordinates
                        if (!empty($data['features']) && is_array($data['features'])) {
                            \Log::info('[Mapbox] Got ' . count($data['features']) . ' results for: ' . $query);
                            
                            return [
                                'success' => true,
                                'features' => $data['features'],
                            ];
                        }

                        \Log::info('[Mapbox] No features returned for: ' . $query);
                        return [
                            'success' => true,
                            'features' => [],
                        ];
                    }

                    \Log::error('[Mapbox API] Returned status ' . $response->status() . ' for: ' . $query);
                    return [
                        'success' => false,
                        'message' => 'Mapbox API returned status ' . $response->status(),
                        'features' => [],
                    ];
                } catch (\Exception $e) {
                    \Log::error('[Mapbox] Exception: ' . $e->getMessage());
                    return [
                        'success' => false,
                        'message' => 'Error: ' . $e->getMessage(),
                        'features' => [],
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
