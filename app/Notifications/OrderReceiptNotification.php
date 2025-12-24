<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class OrderReceiptNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load(['user', 'booking.bookable', 'orderItems.orderable']);
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $totalFormatted = number_format($this->order->total_amount, 0, ',', '.');
        $paidFormatted = number_format($this->order->paid_amount, 0, ',', '.');
        $remaining = $this->order->total_amount - $this->order->paid_amount;
        $booking = $this->order->booking;

        $mail = (new MailMessage)
            ->subject('Receipt: Payment for Order #' . $this->order->order_number)
            ->greeting('Thank you for choosing Travelmore.travel, ' . $this->order->user->name . '!')
            ->line('Your payment has been successfully processed.')
            ->line('---')
            ->line('### Payment Summary')
            ->line('**Order Number:** ' . $this->order->order_number)
            ->line('**Total Price:** Rp ' . $totalFormatted)
            ->line('**Amount Paid:** Rp ' . $paidFormatted);

        if ($remaining > 0) {
            $mail->line('**Remaining Balance:** Rp ' . number_format($remaining, 0, ',', '.'))
                 ->line('⚠️ *Please ensure the balance is settled before the departure date.*');
        } else {
            $mail->line('✅ **Status:** Paid in Full');
        }

        if ($booking) {
            $mail->line('---')->line('**Service Details:**');
            if ($booking->start_date) {
                $dateStr = $booking->start_date->format('d M Y');
                $mail->line('📅 **Date:** ' . $dateStr);
            }
            $details = $booking->details ?? [];
            if (isset($details['pickup_location'])) $mail->line('📍 **Pickup:** ' . $details['pickup_location']);
        }

        return $mail
            ->action('View My Bookings', 'https://travelmore-topaz.vercel.app/en/profile?tab=bookings')
            ->line('If you have any questions, please contact our support team.');
    }
}
