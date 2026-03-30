<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// Sanctum isn't installed in this project; avoid importing its trait here.
use App\Models\Trip;
use App\Models\Inspection;
use App\Models\Issue;
use App\Models\Driver;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'user_type',
        'account_status',
        'company_id',
        'api_token',
        'company_name',
        'company_email',
        'company_phone',
        'company_address',
        'company_city',
        'company_state',
        'company_zip',
        'company_country',
        'company_registration_number',
        'company_tax_id',
        'company_website',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'password' => 'hashed',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function driver()
    {
        return $this->hasOne(\App\Models\Driver::class);
    }

    /**
     * Get approvals made by this user (for super admin).
     */
    public function approvalsGiven()
    {
        return $this->hasMany(Company::class, 'approved_by');
    }

    /**
     * Check if user's account is verified.
     */
    public function isAccountVerified(): bool
    {
        return $this->account_status === 'verified';
    }

    /**
     * Check if user can access dashboard features.
     */
    public function canAccessDashboard(): bool
    {
        return $this->isAccountVerified() && $this->company && $this->company->isApproved();
    }

    /**
     * Send the email verification notification with logging.
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new \App\Notifications\CustomVerifyEmailNotification());
    }

    /**
     * Boot the model - attach deleting event listener
     */
    protected static function boot()
    {
        parent::boot();

        /**
         * Handle cascade deletion when a user is deleted
         * Delete driver record and all driver-specific data
         */
        static::deleting(function ($user) {
            // If this user is a driver, handle driver data cleanup
            if ($user->role === 'driver' && $user->driver) {
                $driver = $user->driver;
                
                // The following deletions are handled by database cascading,
                // but we do them explicitly for safety and to ensure soft deletes work:
                
                // Delete all trips assigned to this driver
                Trip::where('driver_id', $driver->id)->delete();
                
                // Delete all inspections by this driver
                Inspection::where('driver_id', $driver->id)->delete();
                
                // Unassign issues from this driver (set driver_id to null)
                // Issues have onDelete('set null') constraint in database
                Issue::where('driver_id', $driver->id)->update(['driver_id' => null]);
                
                // The driver record will be automatically deleted due to foreign key
                // constraint: drivers.user_id -> users.id onDelete('cascade')
                // But we can explicitly delete it here for clarity:
                $driver->delete();
            }
        });
    }

    // Email verification removed: do not automatically send verification notifications
}
