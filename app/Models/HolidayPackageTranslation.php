<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HolidayPackageTranslation extends Model
{
    use HasFactory;

    // Tentukan field yang bisa diisi
    protected $fillable = [
        'name',
        'description',
        'location',
        'category',
        'slug',   // ✅ Tambahkan slug di sini
        'locale', // Locale harus fillable
    ];

    // Matikan timestamps jika tidak ada di migrasi
    public $timestamps = false;
}
