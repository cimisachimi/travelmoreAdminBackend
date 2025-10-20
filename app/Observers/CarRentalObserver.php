<?php

namespace App\Observers;

use App\Models\CarRental;
use App\Models\CarRentalAvailability;
use Carbon\Carbon;

class CarRentalObserver
{
    /**
     * Handle the CarRental "created" event.
     *
     * This will automatically create availability data for the next 365 days
     * setting them all to 'available' by default.
     *
     * @param  \App\Models\CarRental  $carRental
     * @return void
     */
    public function created(CarRental $carRental)
    {
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addYear();
        
        $dates = [];
        
        for ($date = $startDate; $date->lte($endDate); $date->addDay()) {
            $dates[] = [
                'car_rental_id' => $carRental->id,
                'date' => $date->toDateString(),
                'status' => 'available', // Default status
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert all dates in a single query
        CarRentalAvailability::insert($dates);
    }
}