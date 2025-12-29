<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\CarRental;
use App\Models\HolidayPackage;
use App\Models\OpenTrip;
use App\Models\Activity;
use App\Models\TripPlanner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class OrderReceiptNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load([
            'user',
            'booking.bookable',
            'orderItems.orderable'
        ]);
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->order;
        $booking = $order->booking;
        $bookable = $booking->bookable;

        // 1. Determine the view based on the class name of the bookable model
        $serviceType = Str::kebab(class_basename($bookable)); // results in 'car-rental', 'holiday-package', etc.
        $viewPath = "emails.orders.{$serviceType}";

        // Fallback if a specific template doesn't exist
        if (!view()->exists($viewPath)) {
            $viewPath = 'emails.order-receipt';
        }

        // 2. Prepare WhatsApp Link
        $companyWa = '628123456789';
        $waText = "Hi Travelmore, I am confirming Order #{$order->order_number} for {$order->user->name}. My WhatsApp number needs to be updated. Please help!";
        $waUrl = "https://wa.me/{$companyWa}?text=" . urlencode($waText);

        return (new MailMessage)
            ->subject('Travelmore ' . Str::headline($serviceType) . ' Confirmation - Order #' . $order->order_number)
            ->markdown($viewPath, [
                'order' => $order,
                'booking' => $booking,
                'bookable' => $bookable,
                'waUrl' => $waUrl,
            ]);
    }
}
