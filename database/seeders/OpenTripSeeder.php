<?php

namespace Database\Seeders;

use App\Models\OpenTrip;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OpenTripSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Merapi Lava Tour (Adventure)
        $merapi = OpenTrip::create([
            'duration' => 1,
            'rating' => 4.8,
            'map_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3954.498822037136!2d110.4219443!3d-7.6294444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5e8900000001%3A0x6c6e7d8e9f0a1b2c!2sMount%20Merapi!5e0!3m2!1sen!2sid!4v1625000000000!5m2!1sen!2sid',
            'price_tiers' => [
                ['min_pax' => 1, 'max_pax' => 3, 'price' => 450000],
                ['min_pax' => 4, 'max_pax' => 6, 'price' => 350000],
                ['min_pax' => 7, 'max_pax' => 10, 'price' => 300000],
            ],
            'meeting_points' => [
                ['name' => 'Hotel Pick-up (City Area)', 'time' => '07:00'],
                ['name' => 'Basecamp Kaliurang', 'time' => '08:00'],
            ],
            'cost' => [
                'included' => ['Jeep Rental', 'Driver & Fuel', 'Entrance Fees', 'Mineral Water', 'Safety Helmet'],
                'excluded' => ['Personal Expenses', 'Lunch', 'Tipping Driver'],
            ],
            'itinerary' => [
                [
                    'day' => 1,
                    'title' => 'Lava Tour Adventure',
                    'activities' => [
                        'Pick up at Hotel',
                        'Visit The Lost World Castle',
                        'Explore Alien Stone',
                        'Visit Bunker Kaliadem',
                        'Offroad sensation at Kalikuning River',
                        'Drop off at Hotel'
                    ]
                ]
            ]
        ]);

        $this->addTranslations($merapi->id, [
            'en' => [
                'name' => 'Merapi Lava Tour by Jeep',
                'location' => 'Sleman, Yogyakarta',
                'category' => 'Adventure',
                'description' => 'Experience the thrill of exploring the slopes of Mount Merapi using a 4x4 Jeep. Visit historical sites affected by the 2010 eruption and enjoy the cool mountain breeze.',
            ],
            'id' => [
                'name' => 'Wisata Jeep Merapi Lava Tour',
                'location' => 'Sleman, Yogyakarta',
                'category' => 'Petualangan',
                'description' => 'Rasakan sensasi menjelajahi lereng Gunung Merapi menggunakan Jeep 4x4. Kunjungi situs bersejarah terdampak erupsi 2010 dan nikmati udara pegunungan yang sejuk.',
            ]
        ]);

        // 2. Borobudur & Prambanan (Culture)
        $heritage = OpenTrip::create([
            'duration' => 1,
            'rating' => 4.9,
            'map_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.96789456789!2d110.203895!3d-7.607895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMzYnMjguNCJTIDExMMKwMTInMTQuMCJF!5e0!3m2!1sen!2sid!4v1625000000000!5m2!1sen!2sid',
            'price_tiers' => [
                ['min_pax' => 2, 'max_pax' => 4, 'price' => 850000],
                ['min_pax' => 5, 'max_pax' => 10, 'price' => 750000],
            ],
            'meeting_points' => [
                ['name' => 'Yogyakarta Tugu Station', 'time' => '06:30'],
                ['name' => 'Hotel Lobby', 'time' => '07:00'],
            ],
            'cost' => [
                'included' => ['Private Car (AC)', 'English Speaking Driver', 'Parking Fees', 'Mineral Water'],
                'excluded' => ['Entrance Tickets (Borobudur & Prambanan)', 'Lunch', 'Temple Guide'],
            ],
            'itinerary' => [
                [
                    'day' => 1,
                    'title' => 'Ancient Temples Tour',
                    'activities' => [
                        'Pick up participants',
                        'Visit Borobudur Temple (World Largest Buddhist Temple)',
                        'Lunch at local restaurant (Silver & Batik area)',
                        'Visit Prambanan Temple',
                        'Sunset at Ratu Boko (Optional)',
                        'Return to city'
                    ]
                ]
            ]
        ]);

        $this->addTranslations($heritage->id, [
            'en' => [
                'name' => 'Borobudur & Prambanan Heritage Tour',
                'location' => 'Magelang & Sleman',
                'category' => 'Culture',
                'description' => 'Witness the magnificence of the worlds largest Buddhist temple, Borobudur, and the towering Hindu temple, Prambanan, in a single day trip.',
            ],
            'id' => [
                'name' => 'Tur Warisan Budaya Borobudur & Prambanan',
                'location' => 'Magelang & Sleman',
                'category' => 'Budaya',
                'description' => 'Saksikan kemegahan candi Buddha terbesar di dunia, Borobudur, dan candi Hindu yang menjulang tinggi, Prambanan, dalam perjalanan satu hari.',
            ]
        ]);

        // 3. Jomblang Cave & Timang Beach (Nature)
        $jomblang = OpenTrip::create([
            'duration' => 1,
            'rating' => 5.0,
            'map_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.23456789!2d110.654321!3d-8.012345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMDAnNDQuNCJTIDExMMKwMzknMTUuNiJF!5e0!3m2!1sen!2sid!4v1625000000000!5m2!1sen!2sid',
            'price_tiers' => [
                ['min_pax' => 2, 'max_pax' => 4, 'price' => 1100000],
                ['min_pax' => 5, 'max_pax' => 12, 'price' => 950000],
            ],
            'meeting_points' => [
                ['name' => 'Hotel Pick-up', 'time' => '06:00'],
            ],
            'cost' => [
                'included' => ['Transport', 'Jomblang Cave Equipment (Boots, Helmet, Harness)', 'Lunch Box at Jomblang', 'Jeep to Timang Beach'],
                'excluded' => ['Gondola Ticket at Timang (IDR 200k)', 'Personal Expenses'],
            ],
            'itinerary' => [
                [
                    'day' => 1,
                    'title' => 'Cave & Beach Exploration',
                    'activities' => [
                        'Early morning pick up (06:00 AM)',
                        'Registration at Jomblang Cave',
                        'Vertical caving activity & Heaven Light photo session',
                        'Lunch at Jomblang location',
                        'Drive to Timang Beach',
                        'Ride the Gondola or Bridge crossing',
                        'Return to Yogyakarta'
                    ]
                ]
            ]
        ]);

        $this->addTranslations($jomblang->id, [
            'en' => [
                'name' => 'Jomblang Cave & Timang Beach Gondola',
                'location' => 'Gunung Kidul',
                'category' => 'Nature',
                'description' => 'An adventurous journey descending 60 meters into Jomblang Cave to see the "Light of Heaven", followed by a thrill ride on the Timang Beach gondola above crashing waves.',
            ],
            'id' => [
                'name' => 'Goa Jomblang & Gondola Pantai Timang',
                'location' => 'Gunung Kidul',
                'category' => 'Alam',
                'description' => 'Perjalanan petualangan menuruni 60 meter ke dalam Goa Jomblang untuk melihat "Cahaya Surga", dilanjutkan dengan memacu adrenalin di gondola Pantai Timang di atas deburan ombak.',
            ]
        ]);
    }

    /**
     * Helper to insert translations directly into the translation table.
     */
    private function addTranslations($tripId, $data)
    {
        foreach ($data as $locale => $fields) {
            DB::table('open_trip_translations')->insert([
                'open_trip_id' => $tripId,
                'locale' => $locale,
                'name' => $fields['name'],
                'location' => $fields['location'],
                'category' => $fields['category'],
                'description' => $fields['description'],
            ]);
        }
    }
}
