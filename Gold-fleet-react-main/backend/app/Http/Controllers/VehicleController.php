<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $companyId = auth()->user()->company_id;
            $query = Vehicle::where('company_id', $companyId);

            if (auth()->user()->role === 'driver') {
                $driver = auth()->user()->driver;
                if ($driver && $driver->vehicle_id) {
                    $query->where('id', $driver->vehicle_id);
                } else {
                    return response()->json(['data' => []]);
                }
            }

            $vehicles = $query->with(['trips' => function($query) {
                    $query->latest()->limit(1);
                }])
                ->get();

            return response()->json(['data' => $vehicles]);
        } catch (\Exception $e) {
            \Log::error('Vehicle index error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve vehicles: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return response()->json(['message' => 'Provide vehicle data to create.']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $companyId = auth()->user()->company_id;

            $validator = Validator::make($request->all(), [
                'image' => 'nullable|file|mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,text/svg+xml,image/bmp,image/tiff|max:51200',
                'name' => 'required|string|max:255',
                'license_plate' => 'required|string|max:255|unique:vehicles,license_plate',
                'type' => 'required|in:Car,Bus,Truck,Van',
                'make' => 'required|string|max:255',
                'model' => 'required|string|max:255',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
                'vin' => 'required|string|max:255|unique:vehicles,vin',
                'status' => 'required|in:active,inactive,maintenance',
                'fuel_capacity' => 'nullable|numeric|min:0',
                'fuel_type' => 'required|in:diesel,gasoline,electric,hybrid',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Log incoming files for debugging
            \Log::info('Vehicle store - incoming files: ' . json_encode(array_map(function($f){ return $f->getClientOriginalName(); }, $request->allFiles())));

            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                try {
                    $imagePath = ImageService::processImage($request->file('image'), 'vehicles');
                } catch (\Exception $e) {
                    return response()->json(['errors' => ['image' => [$e->getMessage()]]], 422);
                }
            }

            $vehicle = Vehicle::create([
                'company_id' => $companyId,
                'image' => $imagePath,
                'name' => $request->name,
                'license_plate' => $request->license_plate,
                'type' => $request->type,
                'make' => $request->make,
                'model' => $request->model,
                'year' => $request->year,
                'vin' => $request->vin,
                'status' => $request->status,
                'fuel_capacity' => $request->fuel_capacity,
                'fuel_type' => $request->fuel_type,
                'notes' => $request->notes,
            ]);

            return response()->json(['success' => true, 'message' => 'Vehicle created successfully.', 'data' => $vehicle], 201);
        } catch (\Exception $e) {
            \Log::error('Vehicle creation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create vehicle: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Vehicle $vehicle)
    {
        try {
            // Ensure vehicle belongs to user's company
            if ($vehicle->company_id !== auth()->user()->company_id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $vehicle->load([
                'trips' => function($query) {
                    $query->latest()->limit(10);
                },
                'services' => function($query) {
                    $query->latest()->limit(10);
                },
                'issues' => function($query) {
                    $query->latest()->limit(10);
                },
                'expenses' => function($query) {
                    $query->latest()->limit(10);
                },
                'fuelFillups' => function($query) {
                    $query->latest()->limit(10);
                },
                'reminders' => function($query) {
                    $query->where('status', 'pending')->latest()->limit(5);
                }
            ]);

            return response()->json($vehicle);
        } catch (\Exception $e) {
            \Log::error('Vehicle show error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve vehicle: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Vehicle $vehicle)
    {
        // Ensure vehicle belongs to user's company
        if ($vehicle->company_id !== auth()->user()->company_id) {
            abort(403);
        }

        return response()->json(['data' => $vehicle]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vehicle $vehicle)
    {
        try {
            // Ensure vehicle belongs to user's company
            if ($vehicle->company_id !== auth()->user()->company_id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'image' => 'nullable|file|mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,text/svg+xml,image/bmp,image/tiff|max:51200',
                'name' => 'required|string|max:255',
                'license_plate' => 'required|string|max:255|unique:vehicles,license_plate,' . $vehicle->id,
                'type' => 'required|in:Car,Bus,Truck,Van',
                'make' => 'required|string|max:255',
                'model' => 'required|string|max:255',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
                'vin' => 'required|string|max:255|unique:vehicles,vin,' . $vehicle->id,
                'status' => 'required|in:active,inactive,maintenance',
                'fuel_capacity' => 'nullable|numeric|min:0',
                'fuel_type' => 'required|in:diesel,gasoline,electric,hybrid',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Log incoming files for debugging
            \Log::info('Vehicle update - incoming files: ' . json_encode(array_map(function($f){ return $f->getClientOriginalName(); }, $request->allFiles())));

            // Handle image upload
            $imagePath = $vehicle->image;
            if ($request->hasFile('image')) {
                try {
                    // Delete old image
                    ImageService::deleteImage($vehicle->image);
                    // Process and store new image
                    $imagePath = ImageService::processImage($request->file('image'), 'vehicles');
                } catch (\Exception $e) {
                    return response()->json(['errors' => ['image' => [$e->getMessage()]]], 422);
                }
            }

            $vehicle->update([
                'image' => $imagePath,
                'name' => $request->name,
                'license_plate' => $request->license_plate,
                'type' => $request->type,
                'make' => $request->make,
                'model' => $request->model,
                'year' => $request->year,
                'vin' => $request->vin,
                'status' => $request->status,
                'fuel_capacity' => $request->fuel_capacity,
                'fuel_type' => $request->fuel_type,
                'notes' => $request->notes,
            ]);

            return response()->json(['success' => true, 'message' => 'Vehicle updated successfully.', 'data' => $vehicle]);
        } catch (\Exception $e) {
            \Log::error('Vehicle update error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update vehicle: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vehicle $vehicle)
    {
        try {
            // Ensure vehicle belongs to user's company
            if ($vehicle->company_id !== auth()->user()->company_id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Admin-only access
            if (auth()->user()->role !== 'admin') {
                return response()->json(['error' => 'Only admins can delete vehicles.'], 403);
            }

            // Delete image from storage
            ImageService::deleteImage($vehicle->image);

            $vehicle->delete();

            return response()->json(['success' => true, 'message' => 'Vehicle deleted successfully.']);
        } catch (\Exception $e) {
            \Log::error('Vehicle deletion error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete vehicle: ' . $e->getMessage()], 500);
        }
    }
}
