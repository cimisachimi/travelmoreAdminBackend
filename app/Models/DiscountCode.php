<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscountCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'max_uses',
        'uses',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'value' => 'decimal:2',
    ];

    /**
     * Check if the discount code is valid.
     */
    public function isValid(): bool
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->uses >= $this->max_uses) {
            return false;
        }

        return true;
    }

    /**
     * Calculate the discount for a given amount.
     */
    public function calculateDiscount(float $amount): float
    {
        if ($this->type === 'fixed') {
            return min($this->value, $amount); // Don't allow discount to be more than total
        }

        if ($this->type === 'percent') {
            return ($amount * $this->value) / 100;
        }

        return 0;
    }
}
