<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Company;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    /**
     * Get messages for authenticated user/company
     * GET /api/messages
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $companyId = $user->company_id;
        $userId = $user->id;

        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'User not associated with a company',
            ], 400);
        }

        try {
            $messages = Message::forCompany($companyId)
                ->with(['fromUser', 'toUser', 'company'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $unreadCount = Message::forCompany($companyId)
                ->where(function ($q) use ($userId) {
                    $q->where('to_user_id', $userId)
                      ->orWhereNull('to_user_id');
                })
                ->unread()
                ->count();

            return response()->json([
                'success' => true,
                'data' => $messages,
                'unread_count' => $unreadCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch messages: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages',
            ], 500);
        }
    }

    /**
     * Get specific message
     * GET /api/messages/{id}
     */
    public function show(Message $message): JsonResponse
    {
        $user = auth()->user();

        // Check authorization
        if ($message->company_id !== $user->company_id) {
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
     * Send message from company user
     * POST /api/messages
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $companyId = $user->company_id;

        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'No company assigned',
            ], 400);
        }

        try {
            $validated = $request->validate([
                'subject' => 'required|string|max:255',
                'message' => 'required|string',
                'to_user_id' => 'nullable|exists:users,id',
            ]);

            $message = Message::create([
                'company_id' => $companyId,
                'from_user_id' => $user->id,
                'from_type' => 'company',
                'to_type' => 'platform',
                'to_user_id' => $validated['to_user_id'] ?? null, // Platform admin
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

            // Notify platform admin
            $this->notifyPlatformAdmin($message);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $message->load('fromUser', 'company'),
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
     * Reply to message
     * POST /api/messages/{id}/reply
     */
    public function reply(Message $message, Request $request): JsonResponse
    {
        $user = auth()->user();

        // Check authorization
        if ($message->company_id !== $user->company_id) {
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
                'from_type' => 'company',
                'to_type' => 'platform',
                'to_user_id' => $message->from_user_id,
                'name' => $user->name,
                'email' => $user->email,
                'subject' => 'Re: ' . $message->subject,
                'message' => $validated['message'],
                'body' => $validated['message'],
                'read' => false,
                'status' => 'sent',
            ]);

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
     * PATCH /api/messages/{id}/read
     */
    public function markAsRead(Message $message): JsonResponse
    {
        $user = auth()->user();

        // Check authorization
        if ($message->company_id !== $user->company_id) {
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
     * Delete message
     * DELETE /api/messages/{id}
     */
    public function destroy(Message $message): JsonResponse
    {
        $user = auth()->user();

        // Check authorization
        if ($message->company_id !== $user->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }

    private function notifyPlatformAdmin(Message $message)
    {
        try {
            $platformAdmins = User::where('role', 'platform_admin')
                ->get();

            if ($platformAdmins->isEmpty()) {
                Log::warning('No platform admins found to notify about message: ' . $message->id);
                return;
            }

            foreach ($platformAdmins as $admin) {
                Notification::create([
                    'company_id' => $message->company_id,
                    'user_id' => $admin->id,
                    'type' => 'message',
                    'source_type' => 'company_user',
                    'source_id' => $message->id,
                    'title' => 'New Message from ' . ($message->fromUser ? $message->fromUser->name : 'Company'),
                    'message' => 'You have a new message: ' . substr($message->subject, 0, 50),
                    'data' => [
                        'message_id' => $message->id,
                        'company_id' => $message->company_id,
                        'redirect_url' => '/platform/messages/' . $message->id,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify platform admin: ' . $e->getMessage());
        }
    }
}
