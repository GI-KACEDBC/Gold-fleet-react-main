<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;

class TripController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $companyId = auth()->user()->company_id ?? 1;
        $query = Trip::with('vehicle', 'driver', 'driver.user')
            ->where('company_id', $companyId);
        
        if (auth()->user()->role === 'driver') {
            $query->where('driver_id', auth()->user()->driver->id ?? null);
        }
        
        $trips = $query->get();
        return response()->json(['data' => $trips]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return response()->json(['message' => 'Provide trip details to create.']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|integer|exists:vehicles,id',
                'driver_id' => 'required|integer|exists:drivers,id',
                'start_location' => 'required|string|max:255',
                'end_location' => 'required|string|max:255',
                'start_time' => 'required|date_format:Y-m-d\TH:i',
                'end_time' => 'nullable|date_format:Y-m-d\TH:i',
                'start_mileage' => 'required|numeric|min:0',
                'end_mileage' => 'nullable|numeric|min:0',
                'distance' => 'nullable|numeric|min:0',
                'trip_date' => 'required|date',
                'status' => 'nullable|in:planned,in_progress,active,completed,cancelled',
                'origin_lat' => 'nullable|numeric',
                'origin_lng' => 'nullable|numeric',
                'destination_lat' => 'nullable|numeric',
                'destination_lng' => 'nullable|numeric',
            ]);

            $validated['company_id'] = auth()->user()->company_id ?? 1;
            $validated['status'] = $validated['status'] ?? 'planned';
            
            $trip = Trip::create($validated);
            return response()->json(['data' => $trip->load('vehicle', 'driver', 'driver.user')], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Trip store error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create trip: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Trip $trip)
    {
        if ($trip->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return response()->json(['data' => $trip->load('vehicle', 'driver', 'driver.user')]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Trip $trip)
    {
        if ($trip->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return response()->json(['data' => $trip->load('vehicle', 'driver', 'driver.user')]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Trip $trip)
    {
        if ($trip->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|integer|exists:vehicles,id',
                'driver_id' => 'required|integer|exists:drivers,id',
                'start_location' => 'required|string|max:255',
                'end_location' => 'required|string|max:255',
                'start_time' => 'required|date_format:Y-m-d\TH:i',
                'end_time' => 'nullable|date_format:Y-m-d\TH:i',
                'start_mileage' => 'required|numeric|min:0',
                'end_mileage' => 'nullable|numeric|min:0',
                'distance' => 'nullable|numeric|min:0',
                'trip_date' => 'required|date',
                'status' => 'nullable|in:planned,in_progress,active,completed,cancelled',
                'origin_lat' => 'nullable|numeric',
                'origin_lng' => 'nullable|numeric',
                'destination_lat' => 'nullable|numeric',
                'destination_lng' => 'nullable|numeric',
            ]);

            $trip->update($validated);
            return response()->json(['data' => $trip->load('vehicle', 'driver', 'driver.user')]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Trip update error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'trip_id' => $trip->id,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update trip: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Trip $trip)
    {
        if ($trip->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        try {
            $trip->delete();
            return response()->json(['success' => true, 'message' => 'Trip deleted successfully.']);
        } catch (\Exception $e) {
            \Log::error('Trip delete error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'trip_id' => $trip->id,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete trip: ' . $e->getMessage(),
            ], 500);
        }
    }
}
