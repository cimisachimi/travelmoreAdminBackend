<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderReceiptNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format($this->order->total_amount, 0, ',', '.');

        $mail = (new MailMessage)
            ->subject('Receipt for Your Order #' . $this->order->order_number)
            ->greeting('Thank you for your purchase, ' . $this->order->user->name . '!')
            ->line('Your payment has been successfully processed.')
            ->line('**Order Number:** ' . $this->order->order_number)
            ->line('**Total Amount:** Rp ' . $amount);

        // Add each item from the order to the email
        foreach ($this->order->orderItems as $item) {
            $name = $item->name ?? 'Service';
            // Use your existing logic to determine names for car rentals
            if ($item->orderable instanceof \App\Models\CarRental) {
                $name = $item->orderable->brand . ' ' . $item->orderable->car_model;
            }
            $mail->line("- {$name} (x{$item->quantity}): Rp " . number_format($item->price, 0, ',', '.'));
        }

        return $mail
            ->action('View My Orders', url('/my-orders'))
            ->line('We look forward to seeing you soon!');
    }
}
