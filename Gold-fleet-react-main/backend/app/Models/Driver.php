<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'user_id',
        'created_by',
        'setup_token',
        'account_activated',
        'vehicle_id',
        'license_number',
        'license_expiry',
        'phone',
        'status',
        'image',
        'address',
    ];

    // Append computed URL to JSON responses
    protected $appends = ['image_url'];

    protected $casts = [
        'license_expiry' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image) {
            return null;
        }

        $storagePath = 'storage/' . $this->image;

        // Check if the storage symlink exists and file is accessible
        if (file_exists(public_path($storagePath))) {
            return asset($storagePath);
        }

        // Fallback: try direct storage path (if symlink failed)
        $directPath = 'storage/app/public/' . $this->image;
        if (file_exists(storage_path('app/public/' . $this->image))) {
            // This won't work via web without a route, so return null with warning
            \Log::warning("Image file exists but storage symlink is missing for driver {$this->id}: {$this->image}");
            return null; // Or return a placeholder image URL
        }

        return null;
    }
}
