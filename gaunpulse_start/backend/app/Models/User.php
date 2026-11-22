<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'password',
    'municipality_id',
    'role',
    'is_active',
    'contact_number',
    'ward_number',
    'preferred_language',
    'profile_photo_path',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_SYSTEM_ADMIN = 'system_admin';
    public const ROLE_MUNICIPALITY_ADMIN = 'municipality_admin';
    public const ROLE_WARD_OFFICER = 'ward_officer';
    public const ROLE_CITIZEN = 'citizen';

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(Municipality::class, 'municipality_id');
    }

    public function isSystemAdmin(): bool
    {
        return $this->role === self::ROLE_SYSTEM_ADMIN;
    }

    public function isMunicipalityAdmin(): bool
    {
        return $this->role === self::ROLE_MUNICIPALITY_ADMIN;
    }

    public function isWardOfficer(): bool
    {
        return $this->role === self::ROLE_WARD_OFFICER;
    }

    public function isCitizen(): bool
    {
        return $this->role === self::ROLE_CITIZEN || empty($this->role);
    }

    /**
     * Backwards-compatible admin check for municipal operations.
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_SYSTEM_ADMIN, self::ROLE_MUNICIPALITY_ADMIN, 'admin'], true);
    }

    /**
     * Check if user is staff (system_admin, municipality_admin, or ward_officer).
     */
    public function isStaff(): bool
    {
        return in_array($this->role, [
            self::ROLE_SYSTEM_ADMIN,
            self::ROLE_MUNICIPALITY_ADMIN,
            self::ROLE_WARD_OFFICER,
            'admin',
        ], true);
    }

    public function hasRole(string|array $roles): bool
    {
        $roles = (array) $roles;
        return in_array($this->role, $roles, true);
    }

    /**
     * Check if user is permitted to access a given municipality ID.
     */
    public function canAccessMunicipality(?int $municipalityId): bool
    {
        if ($this->isSystemAdmin()) {
            return true;
        }

        if (!$municipalityId || !$this->municipality_id) {
            return false;
        }

        return (int) $this->municipality_id === (int) $municipalityId;
    }

    /**
     * Check if user is permitted to access a given ward number.
     */
    public function canAccessWard(?int $wardNumber): bool
    {
        if ($this->isSystemAdmin() || $this->isMunicipalityAdmin() || $this->role === 'admin') {
            return true;
        }

        if ($this->isWardOfficer()) {
            return (int) $this->ward_number === (int) $wardNumber;
        }

        return true;
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    public function citizenNotifications(): HasMany
    {
        return $this->hasMany(CitizenNotification::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'ward_number' => 'integer',
            'municipality_id' => 'integer',
        ];
    }
}
