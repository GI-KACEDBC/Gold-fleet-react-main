<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use App\Models\TripSimulation;
use App\Models\VehicleLocation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * TripSimulationController
 * 
 * Handles all trip simulation operations including:
 * - Creating new trips with GPS coordinates
 * - Approving trips and starting simulations
 * - Updating vehicle locations during simulation
 * - Fetching live trip data for dashboard display
 * - Stopping and completing simulations
 * 
 * API Routes:
 * POST   /api/trips -> Create new trip
 * POST   /api/trips/{id}/approve -> Approve and start simulation
 * POST   /api/vehicle/location -> Update vehicle location during simulation
 * GET    /api/trips/{id}/locations -> Get all locations for a trip
 * GET    /api/trips/{id}/simulation -> Get simulation details
 * POST   /api/trips/{id}/simulation/stop -> Stop simulation
 */
class TripSimulationController extends Controller
{
    /**
     * Create a new trip with GPS coordinates.
     * 
     * Called by: Company dashboard
     * Payload: { vehicle_id, driver_id, origin_lat, origin_lng, destination_lat, destination_lng, start_time }
     * Returns: Trip object with status = pending
     */
    public function createTrip(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'origin_lat' => 'required|numeric|between:-90,90',
            'origin_lng' => 'required|numeric|between:-180,180',
            'destination_lat' => 'required|numeric|between:-90,90',
            'destination_lng' => 'required|numeric|between:-180,180',
            'start_time' => 'required|date_format:Y-m-d H:i:s',
            'notes' => 'nullable|string',
        ]);

        // Get the current user's company
        $user = Auth::user();
        $companyId = $user->company_id;

        try {
            // Create the trip
            $trip = Trip::create([
                'company_id' => $companyId,
                'vehicle_id' => $validated['vehicle_id'],
                'driver_id' => $validated['driver_id'],
                'status' => 'pending',
                'start_time' => $validated['start_time'],
                'origin_lat' => $validated['origin_lat'],
                'origin_lng' => $validated['origin_lng'],
                'destination_lat' => $validated['destination_lat'],
                'destination_lng' => $validated['destination_lng'],
                'notes' => $validated['notes'] ?? null,
                'start_mileage' => 0,
                'distance' => 0.0,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Trip created successfully',
                'trip' => $this->formatTripResponse($trip),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating trip: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve a trip and start simulation.
     * 
     * Called by: Driver
     * Changes: Trip status from pending -> approved
     * Creates: TripSimulation record with is_active = true
     * Returns: Updated trip with simulation details
     */
    public function approveTrip(Request $request, int $tripId): JsonResponse
    {
        try {
            // Get the trip
            $trip = Trip::findOrFail($tripId);

            // Verify trip status is pending
            if ($trip->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip must be in pending status to approve',
                ], 400);
            }

            // Update trip status
            $trip->update(['status' => 'approved']);

            // Create or update simulation record
            $simulation = TripSimulation::updateOrCreate(
                ['trip_id' => $tripId],
                [
                    'is_active' => true,
                    'current_lat' => $trip->origin_lat,
                    'current_lng' => $trip->origin_lng,
                    'segment_index' => 0,
                    'progress_percentage' => 0,
                    'speed_kmh' => 60,
                    'heading' => 0,
                    'started_at' => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Trip approved and simulation started',
                'trip' => $this->formatTripResponse($trip),
                'simulation' => $simulation,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving trip: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update vehicle location during simulation.
     * 
     * Called by: Simulator script every 3 seconds
     * Updates: vehicle_locations table + trip_simulations current position
     * Payload: { vehicle_id, lat, lng, speed, heading }
     * Returns: Location record created
     */
    public function updateLocation(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'speed' => 'nullable|numeric|min:0',
            'heading' => 'nullable|numeric|between:0,360',
        ]);

        try {
            // Create vehicle location record
            $location = VehicleLocation::create([
                'vehicle_id' => $validated['vehicle_id'],
                'latitude' => $validated['lat'],
                'longitude' => $validated['lng'],
                'speed' => $validated['speed'] ?? 0,
                'heading' => $validated['heading'] ?? 0,
                'recorded_at' => now(),
            ]);

            // Get any active simulation for this vehicle
            $simulation = TripSimulation::whereHas('trip', function ($query) use ($validated) {
                $query->where('vehicle_id', $validated['vehicle_id']);
            })
            ->where('is_active', true)
            ->first();

            // Update simulation progress
            if ($simulation) {
                $simulation->update([
                    'current_lat' => $validated['lat'],
                    'current_lng' => $validated['lng'],
                    'speed_kmh' => $validated['speed'] ?? 60,
                    'heading' => $validated['heading'] ?? 0,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'location' => $location,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating location: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all locations for a trip (for playback/history).
     * 
     * Called by: Dashboard map to show historical path
     * Returns: All vehicle_locations records for this trip's vehicle + trip info
     */
    public function getTripLocations(int $tripId): JsonResponse
    {
        try {
            // Get the trip
            $trip = Trip::with('vehicle', 'driver', 'simulation')->findOrFail($tripId);

            // Get all locations for the vehicle
            $locations = VehicleLocation::where('vehicle_id', $trip->vehicle_id)
                ->orderBy('recorded_at', 'asc')
                ->get();

            // Get the active simulation if it exists
            $simulation = $trip->simulation;

            return response()->json([
                'success' => true,
                'trip' => $this->formatTripResponse($trip),
                'locations' => $locations,
                'simulation' => $simulation,
                'route' => [
                    'origin' => $trip->getOriginCoordinates(),
                    'destination' => $trip->getDestinationCoordinates(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trip locations: ' . $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Get simulation details for a trip.
     * 
     * Called by: Driver and Company dashboards
     * Returns: Current simulation state and progress
     */
    public function getSimulationStatus(int $tripId): JsonResponse
    {
        try {
            // Get simulation record
            $simulation = TripSimulation::where('trip_id', $tripId)->firstOrFail();

            return response()->json([
                'success' => true,
                'simulation' => $simulation,
                'is_running' => $simulation->isRunning(),
                'position' => $simulation->getCurrentPosition(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Simulation not found for this trip',
            ], 404);
        }
    }

    /**
     * Stop/complete a simulation.
     * 
     * Called by: Driver or system when trip reaches destination
     * Updates: Marks simulation as inactive and trip as completed
     * Returns: Final trip and simulation state
     */
    public function stopSimulation(int $tripId): JsonResponse
    {
        try {
            // Get simulation
            $simulation = TripSimulation::where('trip_id', $tripId)->firstOrFail();

            // Mark as completed
            $simulation->markCompleted();

            // Get updated trip
            $trip = Trip::findOrFail($tripId);

            return response()->json([
                'success' => true,
                'message' => 'Simulation stopped and trip completed',
                'trip' => $this->formatTripResponse($trip),
                'simulation' => $simulation,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error stopping simulation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all active trips for company dashboard.
     * 
     * Used for: Showing all active simulations with real-time markers
     * Returns: Paginated list of trips with simulation status
     */
    public function getActiveTripsByCompany(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            // Get active trips for this company
            $trips = Trip::where('company_id', $companyId)
                ->whereIn('status', ['approved', 'active'])
                ->with('vehicle', 'driver', 'simulation')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'trips' => $trips->map(fn($trip) => $this->formatTripResponse($trip)),
                'pagination' => [
                    'total' => $trips->total(),
                    'per_page' => $trips->perPage(),
                    'current_page' => $trips->currentPage(),
                    'last_page' => $trips->lastPage(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trips: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get driver's assigned trip.
     * 
     * Used by: Driver dashboard
     * Returns: Single trip with simulation details
     */
    public function getDriverTrip(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Get the driver record
            $driver = $user->driver;
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a driver',
                ], 403);
            }

            // Get the most recent active or pending trip for this driver
            $trip = Trip::where('driver_id', $driver->id)
                ->whereIn('status', ['pending', 'approved', 'active', 'completed'])
                ->latest('created_at')
                ->with('vehicle', 'driver', 'driver.user', 'simulation')
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active trip assigned',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'trip' => $this->formatTripResponse($trip),
                'simulation' => $trip->simulation,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trip: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper method to format trip response consistently.
     */
    private function formatTripResponse(Trip $trip): array
    {
        return [
            'id' => $trip->id,
            'vehicle_id' => $trip->vehicle_id,
            'driver_id' => $trip->driver_id,
            'status' => $trip->status,
            'origin' => [
                'latitude' => (float)$trip->origin_lat,
                'longitude' => (float)$trip->origin_lng,
                'name' => $trip->start_location,
            ],
            'destination' => [
                'latitude' => (float)$trip->destination_lat,
                'longitude' => (float)$trip->destination_lng,
                'name' => $trip->end_location,
            ],
            'vehicle' => $trip->vehicle ? [
                'id' => $trip->vehicle->id,
                'name' => $trip->vehicle->name,
                'make' => $trip->vehicle->make,
                'model' => $trip->vehicle->model,
                'year' => $trip->vehicle->year,
                'license_plate' => $trip->vehicle->license_plate,
                'type' => $trip->vehicle->type,
                'status' => $trip->vehicle->status,
            ] : null,
            'driver' => $trip->driver ? [
                'id' => $trip->driver->id,
                'name' => $trip->driver->user->name ?? 'Unknown',
            ] : null,
            'start_time' => $trip->start_time,
            'distance' => $trip->distance,
            'created_at' => $trip->created_at,
            'updated_at' => $trip->updated_at,
        ];
    }
}
