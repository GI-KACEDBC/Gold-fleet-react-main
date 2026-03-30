<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionItem;
use App\Models\Issue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InspectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $companyId = auth()->user()->company_id ?? 1;
        $inspections = Inspection::with('vehicle', 'driver', 'driver.user', 'items')
            ->where('company_id', $companyId)
            ->get();
        return response()->json(['data' => $inspections]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return response()->json(['message' => 'Provide inspection details to create.']);
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
                'inspection_date' => 'required|date',
                'notes' => 'required|string|min:1',
                'result' => 'nullable|in:pass,fail,conditional_pass',
                'next_due_date' => 'nullable|date',
                'items' => 'nullable|array',
                'items.*.item_name' => 'required|string|in:brakes,tires,lights,engine,oil level,mirrors,horn',
                'items.*.status' => 'required|in:ok,fail',
                'items.*.notes' => 'nullable|string',
            ]);

            $validated['company_id'] = auth()->user()->company_id ?? 1;
            $validated['result'] = $validated['result'] ?? 'pending';
            $validated['status'] = $request->input('status', 'passed');

            $inspection = Inspection::create($validated);

            // Store inspection items
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    InspectionItem::create([
                        'inspection_id' => $inspection->id,
                        'item_name' => $item['item_name'],
                        'status' => $item['status'],
                        'notes' => $item['notes'] ?? null,
                    ]);

                    // Create issue if item failed
                    if ($item['status'] === 'fail') {
                        Issue::create([
                            'company_id' => $validated['company_id'],
                            'vehicle_id' => $inspection->vehicle_id,
                            'driver_id' => $inspection->driver_id,
                            'title' => "Inspection Failed: {$item['item_name']}",
                            'description' => $item['notes'] ?? "Vehicle inspection identified a problem with {$item['item_name']}",
                            'severity' => 'medium',
                            'priority' => 'high',
                            'status' => 'open',
                            'reported_date' => now(),
                        ]);
                    }
                }
                
                // Update inspection status based on items
                $failedItems = collect($validated['items'])->filter(fn($item) => $item['status'] === 'fail');
                if ($failedItems->count() > 0) {
                    $inspection->update(['result' => 'fail', 'status' => 'failed']);
                }
            }

            return response()->json(['data' => $inspection->load('vehicle', 'driver', 'items')], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Inspection store error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create inspection: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Inspection $inspection)
    {
        if ($inspection->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return response()->json(['data' => $inspection->load('vehicle', 'driver', 'driver.user', 'items')]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Inspection $inspection)
    {
        if ($inspection->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return response()->json(['data' => $inspection->load('vehicle', 'driver', 'driver.user', 'items')]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Inspection $inspection)
    {
        if ($inspection->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|integer|exists:vehicles,id',
                'driver_id' => 'required|integer|exists:drivers,id',
                'inspection_date' => 'required|date',
                'notes' => 'required|string|min:1',
                'result' => 'nullable|in:pass,fail,conditional_pass',
                'next_due_date' => 'nullable|date',
                'items' => 'nullable|array',
                'items.*.item_name' => 'required|string|in:brakes,tires,lights,engine,oil level,mirrors,horn',
                'items.*.status' => 'required|in:ok,fail',
                'items.*.notes' => 'nullable|string',
            ]);

            $validated['status'] = $request->input('status', 'passed');

            $inspection->update($validated);

            // Update inspection items
            if (!empty($validated['items'])) {
                // Delete existing items
                $inspection->items()->delete();

                // Create new items
                foreach ($validated['items'] as $item) {
                    InspectionItem::create([
                        'inspection_id' => $inspection->id,
                        'item_name' => $item['item_name'],
                        'status' => $item['status'],
                        'notes' => $item['notes'] ?? null,
                    ]);
                }

                // Update inspection result based on items
                $failedItems = collect($validated['items'])->filter(fn($item) => $item['status'] === 'fail');
                if ($failedItems->count() > 0) {
                    $inspection->update(['result' => 'fail', 'status' => 'failed']);
                } else {
                    $inspection->update(['result' => 'pass', 'status' => 'passed']);
                }
            }

            return response()->json(['data' => $inspection->load('vehicle', 'driver', 'driver.user', 'items')]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Inspection update error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'inspection_id' => $inspection->id,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inspection: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Inspection $inspection)
    {
        if ($inspection->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        try {
            $inspection->delete();
            return response()->json(['success' => true, 'message' => 'Inspection deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Inspection delete error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'inspection_id' => $inspection->id,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inspection: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Driver submits a maintenance checklist
     * POST /api/inspections/submit-checklist
     */
    public function submitChecklist(Request $request)
    {
        try {
            $driver = auth()->user()->driver;

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only drivers can submit checklists',
                ], 403);
            }

            $validated = $request->validate([
                'vehicle_id' => 'required|integer|exists:vehicles,id',
                'checklist_items' => 'required|array|min:1',
                'checklist_items.*.name' => 'required|string',
                'checklist_items.*.checked' => 'required|boolean',
                'checklist_items.*.notes' => 'nullable|string',
                'notes' => 'nullable|string',
                'trip_id' => 'nullable|integer|exists:trips,id',
            ]);

            // Ensure driver has access to this vehicle
            $vehicle = \App\Models\Vehicle::find($validated['vehicle_id']);
            if ($vehicle->company_id !== auth()->user()->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            // Create inspection record
            $inspection = Inspection::create([
                'company_id' => auth()->user()->company_id,
                'vehicle_id' => $validated['vehicle_id'],
                'driver_id' => $driver->id,
                'trip_id' => $validated['trip_id'] ?? null,
                'inspection_date' => now()->toDateString(),
                'notes' => $validated['notes'] ?? 'Driver maintenance checklist submission',
                'status' => 'submitted',
                'result' => 'pending',
                'submitted_by_driver' => true,
                'checklist_items' => $validated['checklist_items'],
                'submitted_at' => now(),
            ]);

            // Create notification for company admins
            $this->notifyAdminsOfChecklist($inspection, $driver);

            return response()->json([
                'success' => true,
                'message' => 'Maintenance checklist submitted successfully',
                'data' => $inspection->load('vehicle', 'driver', 'driver.user'),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Checklist submission error: ' . $e->getMessage(), [
                'driver_id' => auth()->user()->driver->id ?? null,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit checklist: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending inspections for admin review (driver-submitted checklists)
     * GET /api/inspections/pending-reviews
     */
    public function getPendingReviews()
    {
        $companyId = auth()->user()->company_id;

        $pendingInspections = Inspection::with('vehicle', 'driver', 'driver.user')
            ->where('company_id', $companyId)
            ->where('submitted_by_driver', true)
            ->where('admin_reviewed', false)
            ->orderBy('submitted_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pendingInspections,
            'count' => $pendingInspections->count(),
        ]);
    }

    /**
     * Admin reviews and approves/rejects a driver-submitted checklist
     * PATCH /api/inspections/{id}/review
     */
    public function reviewChecklist(Request $request, Inspection $inspection)
    {
        if ($inspection->company_id !== auth()->user()->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            $validated = $request->validate([
                'result' => 'required|in:pass,fail,conditional_pass',
                'admin_notes' => 'nullable|string',
            ]);

            $inspection->update([
                'result' => $validated['result'],
                'admin_reviewed' => true,
                'notes' => ($inspection->notes ?? '') . '\n[Admin Review: ' . $validated['admin_notes'] . ']',
            ]);

            // Notify driver of review
            $this->notifyDriverOfReview($inspection, $validated['result']);
            
            // Notify admin of completed inspection (especially for passed inspections)
            $this->notifyAdminOfCompletedInspection($inspection);

            return response()->json([
                'success' => true,
                'message' => 'Inspection reviewed successfully',
                'data' => $inspection->load('vehicle', 'driver'),
            ]);

        } catch (\Exception $e) {
            Log::error('Inspection review error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to review inspection',
            ], 500);
        }
    }

    /**
     * Notify admins about a new driver-submitted checklist
     */
    private function notifyAdminsOfChecklist(Inspection $inspection, $driver)
    {
        try {
            // Get all admin users for this company
            $admins = \App\Models\User::where('company_id', $inspection->company_id)
                ->where('role', 'admin')
                ->get();

            foreach ($admins as $admin) {
                \App\Models\Notification::create([
                    'company_id' => $inspection->company_id,
                    'user_id' => $admin->id,
                    'type' => 'inspection_checklist',
                    'source_type' => 'driver_checklist',
                    'source_id' => $inspection->id,
                    'source_model' => 'Inspection',
                    'title' => 'New Maintenance Checklist',
                    'message' => "{$driver->user->name} submitted a maintenance checklist for {$inspection->vehicle->make} {$inspection->vehicle->model}",
                    'data' => [
                        'inspection_id' => $inspection->id,
                        'vehicle_id' => $inspection->vehicle_id,
                        'driver_id' => $driver->id,
                        'driver_name' => $driver->user->name,
                        'vehicle_name' => "{$inspection->vehicle->make} {$inspection->vehicle->model}",
                        'action_url' => "/admin/inspections/{$inspection->id}",
                    ],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify admins: ' . $e->getMessage());
        }
    }

    /**
     * Notify driver about inspection review result
     */
    private function notifyDriverOfReview(Inspection $inspection, $result)
    {
        try {
            $resultLabel = match($result) {
                'pass' => 'Approved',
                'fail' => 'Failed',
                'conditional_pass' => 'Conditionally Approved',
            };

            $notificationType = match($result) {
                'pass' => 'inspection_passed',
                'fail' => 'inspection_failed',
                'conditional_pass' => 'inspection_conditional',
            };

            \App\Models\Notification::create([
                'company_id' => $inspection->company_id,
                'user_id' => $inspection->driver->user_id,
                'type' => $notificationType,
                'source_type' => 'inspection',
                'source_id' => $inspection->id,
                'source_model' => 'Inspection',
                'title' => 'Inspection Review Complete',
                'message' => "Your maintenance checklist for {$inspection->vehicle->make} {$inspection->vehicle->model} was {$resultLabel}",
                'data' => [
                    'inspection_id' => $inspection->id,
                    'result' => $result,
                    'vehicle_name' => "{$inspection->vehicle->make} {$inspection->vehicle->model}",
                    'admin_notes' => $inspection->notes,
                    'action_url' => "/driver/inspections/{$inspection->id}",
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify driver: ' . $e->getMessage());
        }
    }

    /**
     * Notify company admin that inspection passed
     */
    private function notifyAdminOfCompletedInspection(Inspection $inspection)
    {
        try {
            // Get all admin users for this company
            $admins = \App\Models\User::where('company_id', $inspection->company_id)
                ->where('role', 'admin')
                ->get();

            $resultLabel = match($inspection->result) {
                'pass' => 'Passed',
                'fail' => 'Failed',
                'conditional_pass' => 'Conditionally Passed',
                default => 'Completed',
            };

            foreach ($admins as $admin) {
                if ($inspection->result === 'pass') {
                    \App\Models\Notification::create([
                        'company_id' => $inspection->company_id,
                        'user_id' => $admin->id,
                        'type' => 'inspection_passed',
                        'source_type' => 'inspection',
                        'source_id' => $inspection->id,
                        'source_model' => 'Inspection',
                        'title' => 'Inspection Passed ✓',
                        'message' => "Inspection for {$inspection->vehicle->make} {$inspection->vehicle->model} by {$inspection->driver->user->name} has {$resultLabel}",
                        'data' => [
                            'inspection_id' => $inspection->id,
                            'vehicle_id' => $inspection->vehicle_id,
                            'driver_id' => $inspection->driver_id,
                            'driver_name' => $inspection->driver->user->name,
                            'vehicle_name' => "{$inspection->vehicle->make} {$inspection->vehicle->model}",
                            'result' => $inspection->result,
                            'action_url' => "/admin/inspections/{$inspection->id}",
                        ],
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify admin of completed inspection: ' . $e->getMessage());
        }
    }

    /**
     * Upload maintenance inspection image
     */
    public function uploadImage(Request $request, Inspection $inspection)
    {
        try {
            $validated = $request->validate([
                'image' => 'required|image|mimes:jpeg,png,gif,webp|max:5120', // 5MB max
            ]);

            // Check authorization - driver can only upload to their own inspections
            if ($inspection->driver_id !== auth()->user()->driverId && auth()->user()->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Delete old image if exists
            if ($inspection->inspection_image_path) {
                $oldPath = storage_path('app/public/' . $inspection->inspection_image_path);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            // Use ImageService for compression (same as driver profile images)
            $imageService = new \App\Services\ImageService();
            $imagePath = $imageService->processImage(
                $request->file('image'),
                'inspections'
            );

            // Update inspection with image path
            $inspection->update(['inspection_image_path' => $imagePath]);

            return response()->json([
                'data' => $inspection,
                'message' => 'Image uploaded successfully'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Inspection image upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image'
            ], 500);
        }
    }
}
