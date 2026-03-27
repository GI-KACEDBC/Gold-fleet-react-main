<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Company;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PlatformMessageController extends Controller
{
    /**
     * Get all messages involving companies (bidirectional)
     * GET /api/platform/messages
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $page = $request->query('page', 1);
        $limit = $request->query('limit', 10);
        $companyId = $request->query('company_id');

        $query = Message::whereNotNull('company_id');

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $messages = $query->with(['fromUser', 'toUser', 'company'])
            ->orderBy('created_at', 'desc')
            ->paginate($limit, ['*'], 'page', $page);

        $unreadQuery = Message::whereNotNull('company_id');
        if ($companyId) {
            $unreadQuery->where('company_id', $companyId);
        }
        $unreadCount = $unreadQuery->where('from_type', 'company')->unread()->count();

        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'pagination' => [
                'total' => $messages->total(),
                'per_page' => $messages->perPage(),
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
            ],
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Send message to company
     * POST /api/platform/messages
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Only platform admins can send messages',
            ], 403);
        }

        try {
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'to_user_id' => 'nullable|exists:users,id',
                'subject' => 'required|string|max:255',
                'message' => 'required|string',
            ]);

            $message = Message::create([
                'company_id' => $validated['company_id'],
                'from_user_id' => $user->id,
                'from_type' => 'platform',
                'to_type' => 'company',
                'to_user_id' => $validated['to_user_id'] ?? null,
                'name' => $user->name,
                'email' => $user->email,
                'subject' => $validated['subject'],
                'message' => $validated['message'],
                'body' => $validated['message'],
                'read' => false,
                'status' => 'sent',
            ]);

            // Load relationships for notification
            $message->load('fromUser', 'company');

            // Notify company users
            $this->notifyCompanyUsers($message);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $message,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to send message: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
            ], 500);
        }
    }

    /**
     * Get specific message
     * GET /api/platform/messages/{id}
     */
    public function show(Message $message): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Mark as read
        if (!$message->read) {
            $message->markAsRead();
        }

        return response()->json([
            'success' => true,
            'data' => $message->load('fromUser', 'toUser', 'company'),
        ]);
    }

    /**
     * Reply to message from company
     * POST /api/platform/messages/{id}/reply
     */
    public function reply(Message $message, Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            $validated = $request->validate([
                'message' => 'required|string',
            ]);

            $reply = Message::create([
                'company_id' => $message->company_id,
                'from_user_id' => $user->id,
                'from_type' => 'platform',
                'to_type' => 'company',
                'to_user_id' => $message->from_user_id,
                'name' => $user->name,
                'email' => $user->email,
                'subject' => 'Re: ' . $message->subject,
                'message' => $validated['message'],
                'body' => $validated['message'],
                'read' => false,
                'status' => 'sent',
            ]);

            // Notify company user
            $this->notifyCompanyUsers($reply);

            return response()->json([
                'success' => true,
                'message' => 'Reply sent successfully',
                'data' => $reply->load('fromUser'),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to send reply: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send reply',
            ], 500);
        }
    }

    /**
     * Mark message as read
     * PATCH /api/platform/messages/{id}/read
     */
    public function markAsRead(Message $message): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $message->markAsRead();

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    /**
     * Get companies list for recipient dropdown
     * GET /api/platform/companies-list
     */
    public function getCompaniesList(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            $search = $request->query('search', '');

            $query = Company::query();

            // Apply search filter if provided
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhere('email', 'like', "%$search%");
                });
            }

            // Get companies, exclusive of soft-deleted ones
            $companies = $query
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->limit(50)
                ->get();

            Log::info('Companies list fetched', [
                'count' => $companies->count(),
                'search' => $search,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'data' => $companies,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch companies list: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch companies list',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get company admins for recipient dropdown
     * GET /api/platform/company/{companyId}/admins
     */
    public function getCompanyAdmins($companyId): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'platform_admin' || !$this->isPlatformAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $admins = User::where('company_id', $companyId)
            ->where('role', 'admin')
            ->select('id', 'name', 'email')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $admins,
        ]);
    }

    /**
     * Notify company users about new message
     */
    private function notifyCompanyUsers(Message $message)
    {
        try {
            if ($message->to_user_id) {
                // Notify specific company user
                Notification::create([
                    'company_id' => $message->company_id,
                    'user_id' => $message->to_user_id,
                    'type' => 'message',
                    'source_type' => 'platform_admin',
                    'source_id' => $message->id,
                    'title' => 'New Message from Platform',
                    'message' => $message->subject,
                    'data' => [
                        'message_id' => $message->id,
                        'company_id' => $message->company_id,
                        'redirect_url' => '/messages/' . $message->id,
                    ],
                ]);
            } else {
                // Notify all company admins
                $admins = User::where('company_id', $message->company_id)
                    ->where('role', 'admin')
                    ->get();

                foreach ($admins as $admin) {
                    Notification::create([
                        'company_id' => $message->company_id,
                        'user_id' => $admin->id,
                        'type' => 'message',
                        'source_type' => 'platform_admin',
                        'source_id' => $message->id,
                        'title' => 'New Message from Platform',
                        'message' => $message->subject,
                        'data' => [
                            'message_id' => $message->id,
                            'company_id' => $message->company_id,
                            'redirect_url' => '/messages/' . $message->id,
                        ],
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify company users: ' . $e->getMessage());
        }
    }

    /**
     * Check if user is platform admin
     * A user is platform admin if:
     * 1. Their role is 'platform_admin', OR
     * 2. They have user_type = 'platform'
     */
    private function isPlatformAdmin($user): bool
    {
        // Check role first (simpler and faster)
        if ($user->role === 'platform_admin') {
            return true;
        }
        
        // Also check user_type as fallback
        if ($user->user_type === 'platform') {
            return true;
        }
        
        return false;
    }
}
