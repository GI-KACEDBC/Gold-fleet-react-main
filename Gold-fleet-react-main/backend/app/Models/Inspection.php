<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inspection extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'vehicle_id',
        'driver_id',
        'trip_id',
        'inspection_date',
        'notes',
        'status',
        'result',
        'next_due_date',
        'submitted_by_driver',
        'checklist_items',
        'submitted_at',
        'admin_reviewed',
        'inspection_image_path',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'submitted_by_driver' => 'boolean',
        'checklist_items' => 'array',
        'submitted_at' => 'datetime',
        'admin_reviewed' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InspectionItem::class);
    }

    /**
     * Scope to get inspections submitted by drivers
     */
    public function scopeSubmittedByDriver($query)
    {
        return $query->where('submitted_by_driver', true);
    }

    /**
     * Scope to get unreviewed inspections
     */
    public function scopeUnreviewed($query)
    {
        return $query->where('admin_reviewed', false);
    }

    /**
     * Get the status label for display
     */
    public function getStatusLabelAttribute()
    {
        if (!$this->submitted_by_driver) {
            return 'Not Submitted';
        }
        if (!$this->admin_reviewed) {
            return 'Pending Review';
        }
        return $this->result ?? 'Completed';
    }
}
