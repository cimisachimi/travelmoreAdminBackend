<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels; // Critical for queued notification stability

class OrderReceiptNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    protected $order;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        // Eager load all necessary data to ensure it's available in the queue worker
        $this->order = $order->load(['user', 'booking.bookable', 'orderItems.orderable']);
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format($this->order->total_amount, 0, ',', '.');
        $booking = $this->order->booking;

        $mail = (new MailMessage)
            ->subject('Receipt for Your Order #' . $this->order->order_number)
            ->greeting('Thank you for choosing Travelmore.travel, ' . $this->order->user->name . '!')


            ->line('Your payment has been successfully processed.')
            ->line('**Order Number:** ' . $this->order->order_number)
            ->line('**Total Amount:** Rp ' . $amount)
            ->line('---');

        // 1. Add Service-Specific details from the Booking
        if ($booking) {
            $mail->line('**Service Details:**');

            // Handle Dates
            if ($booking->start_date) {
                $dateStr = $booking->start_date->format('d M Y');
                if ($booking->end_date && $booking->start_date != $booking->end_date) {
                    $dateStr .= ' to ' . $booking->end_date->format('d M Y');
                }
                $mail->line('📅 **Date:** ' . $dateStr);
            }

            // Extract custom info from the 'details' JSON column
            $details = $booking->details ?? [];
            if (isset($details['pickup_location'])) $mail->line('📍 **Pickup:** ' . $details['pickup_location']);
            if (isset($details['dropoff_location'])) $mail->line('🏁 **Drop-off:** ' . $details['dropoff_location']);
            if (isset($details['pickup_time'])) $mail->line('⏰ **Time:** ' . $details['pickup_time']);
            if (isset($details['flight_number'])) $mail->line('✈️ **Flight:** ' . $details['flight_number']);

            // Special logic for Open Trip Meeting Points
            if ($booking->bookable instanceof \App\Models\OpenTrip && !empty($booking->bookable->meeting_points)) {
                 $points = implode(', ', $booking->bookable->meeting_points);
                 $mail->line('📍 **Meeting Point:** ' . $points);
            }
            $mail->line('---');
        }

        // 2. Add Price Breakdown
        $mail->line('**Price Breakdown:**');
        foreach ($this->order->orderItems as $item) {
            $name = $item->orderable->name ?? $item->orderable->title ?? 'Service';

            // Custom name logic for Car Rentals
            if ($item->orderable instanceof \App\Models\CarRental) {
                $name = $item->orderable->brand . ' ' . $item->orderable->car_model;
            }

            $mail->line("- {$name} (x{$item->quantity}): Rp " . number_format($item->price, 0, ',', '.'));
        }

        // 3. Discount logic
        if ($this->order->discount_amount > 0) {
            $mail->line('**Discount Applied:** -Rp ' . number_format($this->order->discount_amount, 0, ',', '.'));
        }

        return $mail
            ->action('View My Orders', url('/my-orders'))
            ->line('If you have any questions, please contact our support team.')
            ->line('We look forward to seeing you soon!');
    }
}
