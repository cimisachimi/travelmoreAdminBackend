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

   public function toMail(object $notifiable): \Illuminate\Notifications\Messages\MailMessage
{
    $order = $this->order;

    // Prepare WhatsApp Correction Link
    $companyWa = '628123456789'; // TODO: Replace with your active company WhatsApp
    $waText = "Hi Travelmore, I am confirming Order #{$order->order_number} for {$order->user->name}. My WhatsApp number needs to be updated. Please help!";
    $waUrl = "https://wa.me/{$companyWa}?text=" . urlencode($waText);

    return (new \Illuminate\Notifications\Messages\MailMessage)
        ->subject('Travelmore Trip Confirmation - Order #' . $order->order_number)
        ->markdown('emails.order-receipt', [
            'order' => $order,
            'booking' => $order->booking,
            'waUrl' => $waUrl,
        ]);
}
}
