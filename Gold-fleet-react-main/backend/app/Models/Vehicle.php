<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'name',
        'type',
        'make',
        'model',
        'year',
        'license_plate',
        'vin',
        'status',
        'fuel_capacity',
        'fuel_type',
        'mileage',
        'image',
        'notes',
    ];

    protected $casts = [
        'year' => 'integer',
        'fuel_capacity' => 'decimal:2',
        'mileage' => 'decimal:2',
        'type' => 'string',
    ];

    // Append computed URL to JSON responses
    protected $appends = ['image_url'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(Driver::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function vehicleLocations(): HasMany
    {
        return $this->hasMany(VehicleLocation::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function fuelFillups(): HasMany
    {
        return $this->hasMany(FuelFillup::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
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
            \Log::warning("Image file exists but storage symlink is missing for vehicle {$this->id}: {$this->image}");
            return null; // Or return a placeholder image URL
        }

        return null;
    }
}
