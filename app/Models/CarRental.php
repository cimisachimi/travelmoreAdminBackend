<?php
// app/Models/CarRental.php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarRental extends Model {
    use HasFactory;
    protected $guarded = ['id'];
}