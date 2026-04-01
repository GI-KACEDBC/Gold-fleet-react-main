<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class IssueController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $companyId = auth()->user()->company_id ?? 1;
        $issues = Issue::with('vehicle')
            ->where('company_id', $companyId)
            ->get();
        return response()->json(['data' => $issues]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return response()->json(['message' => 'Provide issue details to create.']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'priority' => 'nullable|in:low,medium,high,critical',
                'status' => 'nullable|in:open,in_progress,resolved,closed',
                'reported_date' => 'nullable|date',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'driver_id' => 'nullable|exists:drivers,id',
                'trip_id' => 'nullable|exists:trips,id',
            ]);

            $validated['company_id'] = auth()->user()->company_id ?? 1;
            
            // If driver_id not provided in request, use authenticated user's driver_id
            if (!isset($validated['driver_id']) || $validated['driver_id'] === null) {
                $validated['driver_id'] = auth()->user()->driver_id ?? null;
            }
            
            // trip_id comes from request or remains null
            // (already handled by validation rules)
            
            $validated['severity'] = $validated['priority'] ?? 'medium';
            $validated['status'] = $validated['status'] ?? 'open';
            $validated['reported_date'] = $validated['reported_date'] ?? now();

            // Handle photo upload
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('issues', 'public');
                $validated['photo_path'] = $photoPath;
            }

            $issue = Issue::create($validated);

            // Log what was saved
            \Log::info('Issue created:', [
                'issue_id' => $issue->id,
                'vehicle_id' => $issue->vehicle_id,
                'driver_id' => $issue->driver_id,
                'trip_id' => $issue->trip_id ?? 'NULL',
                'title' => $issue->title,
            ]);

            // Notify admin/company manager
            $this->notifyAdmins($issue);

            return response()->json(['data' => $issue->load('vehicle')], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Issue store error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Issue $issue)
    {
        if ($issue->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return response()->json(['data' => $issue->load('vehicle')]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Issue $issue)
    {
        if ($issue->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return response()->json(['data' => $issue->load('vehicle')]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Issue $issue)
    {
        if ($issue->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        try {
            $validated = $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'priority' => 'nullable|in:low,medium,high,critical',
                'status' => 'nullable|in:open,in_progress,resolved,closed',
                'reported_date' => 'nullable|date',
                'resolution_notes' => 'nullable|string',
                'assigned_mechanic_id' => 'nullable|string',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            ]);

            $validated['severity'] = $validated['priority'] ?? $issue->severity;

            // Handle photo upload
            if ($request->hasFile('photo')) {
                // Delete old photo if exists
                if ($issue->photo_path) {
                    Storage::disk('public')->delete($issue->photo_path);
                }
                $photoPath = $request->file('photo')->store('issues', 'public');
                $validated['photo_path'] = $photoPath;
            }

            $issue->update($validated);

            return response()->json(['data' => $issue->load('vehicle')]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Issue update error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'issue_id' => $issue->id,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Issue $issue)
    {
        if ($issue->company_id !== auth()->user()->company_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        try {
            // Delete photo if exists
            if ($issue->photo_path) {
                Storage::disk('public')->delete($issue->photo_path);
            }
            
            $issue->delete();
            return response()->json(['success' => true, 'message' => 'Issue deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Issue delete error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'issue_id' => $issue->id,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Notify admin users about new issue
     */
    private function notifyAdmins(Issue $issue)
    {
        try {
            $companyId = $issue->company_id;
            
            // Get all admin/company-owner users
            $admins = User::where('company_id', $companyId)
                ->whereIn('role', ['admin', 'owner'])
                ->get();

            foreach ($admins as $admin) {
                Notification::create([
                    'company_id' => $companyId,
                    'user_id' => $admin->id,
                    'type' => 'issue_created',
                    'title' => 'New Vehicle Issue',
                    'message' => "A new issue has been reported: {$issue->title}",
                    'data' => [
                        'issue_id' => $issue->id,
                        'vehicle_id' => $issue->vehicle_id,
                        'driver_id' => $issue->driver_id,
                        'priority' => $issue->priority,
                    ],
                    'read' => false,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to notify admins about issue: ' . $e->getMessage());
        }
    }
}
