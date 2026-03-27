<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'from_user_id',
        'to_user_id',
        'from_type',
        'to_type',
        'name',
        'email',
        'subject',
        'message',
        'body',
        'status',
        'read',
        'read_at',
        'attachments',
    ];

    protected $casts = [
        'read' => 'boolean',
        'read_at' => 'datetime',
        'attachments' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    // Scopes for filtering messages
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('to_user_id', $userId)
              ->orWhereNull('to_user_id'); // Company-wide messages
        });
    }

    public function scopeUnread($query)
    {
        return $query->where('read', false);
    }

    public function scopeFromPlatform($query)
    {
        return $query->where('from_type', 'platform');
    }

    public function scopeFromCompany($query)
    {
        return $query->where('from_type', 'company');
    }

    public function markAsRead()
    {
        $this->update([
            'read' => true,
            'read_at' => now(),
        ]);
    }
}
