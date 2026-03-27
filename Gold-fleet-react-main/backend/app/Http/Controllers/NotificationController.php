<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                    'notifications' => [],
                    'unread_count' => 0,
                ], 401);
            }

            $companyId = $user->company_id;

            $notifications = Notification::where('company_id', $companyId)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhereNull('user_id'); // company-wide notifications
                })
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($notification) {
                    try {
                        return [
                            'id' => $notification->id,
                            'type' => $notification->type,
                            'source_type' => $notification->source_type,
                            'source_id' => $notification->source_id,
                            'title' => $notification->title,
                            'message' => $notification->message,
                            'data' => $notification->data,
                            'read' => (bool) $notification->read,
                            'created_at' => $notification->created_at ? $notification->created_at->toIso8601String() : null,
                            'time_ago' => $notification->created_at ? $notification->created_at->diffForHumans() : 'Unknown',
                        ];
                    } catch (\Exception $e) {
                        \Log::error('Error mapping notification', ['error' => $e->getMessage(), 'notification_id' => $notification->id ?? 'unknown']);
                        return null;
                    }
                })
                ->filter(fn($item) => $item !== null)
                ->values();

            $unreadCount = Notification::where('company_id', $companyId)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhereNull('user_id');
                })
                ->where('read', false)
                ->count();

            return response()->json([
                'success' => true,
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ]);
        } catch (\Exception $e) {
            \Log::error('Notifications index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications: ' . $e->getMessage(),
                'notifications' => [],
                'unread_count' => 0,
            ], 500);
        }
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        // Ensure user can only mark their own notifications
        if ($notification->user_id !== auth()->id() && $notification->company_id !== auth()->user()->company_id) {
            abort(403);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            Notification::where('company_id', $user->company_id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhereNull('user_id');
                })
                ->where('read', false)
                ->update([
                    'read' => true,
                    'read_at' => now(),
                ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Log::error('Mark all notifications as read error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notifications as read',
            ], 500);
        }
    }

    /**
     * Get notifications by source type (inspection, driver_checklist, admin_message, platform_admin)
     * GET /api/notifications/by-source/{sourceType}
     */
    public function getBySourceType(Request $request, $sourceType): JsonResponse
    {
        $user = auth()->user();
        $validSourceTypes = ['inspection', 'driver_checklist', 'admin_message', 'platform_admin', 'system'];

        if (!in_array($sourceType, $validSourceTypes)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid source type',
            ], 422);
        }

        $notifications = Notification::where('company_id', $user->company_id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->bySourceType($sourceType)
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'source_type' => $notification->source_type,
                    'source_id' => $notification->source_id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'read' => $notification->read,
                    'created_at' => $notification->created_at,
                    'time_ago' => $notification->created_at->diffForHumans(),
                    'data' => $notification->data,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'source_type' => $sourceType,
        ]);
    }

    /**
     * Get inspection-related notifications only
     * GET /api/notifications/inspections
     */
    public function getInspectionNotifications(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = Notification::where('company_id', $user->company_id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->inspectionNotifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'source_type' => 'inspection',
        ]);
    }

    /**
     * Get driver checklist-related notifications
     * GET /api/notifications/driver-checklists
     */
    public function getDriverChecklistNotifications(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = Notification::where('company_id', $user->company_id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->driverChecklistNotifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'source_type' => 'driver_checklist',
        ]);
    }

    /**
     * Get admin message-related notifications
     * GET /api/notifications/admin-messages
     */
    public function getAdminMessageNotifications(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = Notification::where('company_id', $user->company_id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->adminMessageNotifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'source_type' => 'admin_message',
        ]);
    }

    /**
     * Get platform admin-related notifications
     * GET /api/notifications/platform-admin
     */
    public function getPlatformAdminNotifications(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = Notification::where('company_id', $user->company_id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->platformAdminNotifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'source_type' => 'platform_admin',
        ]);
    }
}
