<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class NewOrderAdminNotification extends Notification implements ShouldQueue
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
        $booking = $this->order->booking;

        $mail = (new MailMessage)
            ->subject('New Payment Received: Order #' . $this->order->order_number)
            ->greeting('Hello Admin,')
            ->line('A new payment has been processed for **' . $this->order->user->name . '**.')
            ->line('---')
            ->line('### Order Details')
            ->line('**Order Number:** ' . $this->order->order_number)
            ->line('**Total Amount:** Rp ' . $totalFormatted)
            ->line('**Amount Paid:** Rp ' . $paidFormatted);

        // Menambahkan rincian item untuk admin
        $mail->line('---')->line('**Items Purchased:**');
        foreach ($this->order->orderItems as $item) {
            $name = $item->orderable->name ?? $item->orderable->title ?? 'Service';
            $mail->line("- {$name} (x{$item->quantity}): Rp " . number_format($item->price, 0, ',', '.'));
        }

        return $mail
            ->action('View All Orders', 'https://api.travelmore.travel/admin/orders')
            ->line('Please check the dashboard for management.');
    }
}
