<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail']; // You can add 'database' here if you have in-app notifications
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Calculate amount for display
        $amount = number_format($this->order->total_amount, 0, ',', '.');

        return (new MailMessage)
                    ->subject('New Order Received: #' . $this->order->order_number)
                    ->greeting('Hello Admin,')
                    ->line('A new order has been successfully paid and confirmed.')
                    ->line('**Order Number:** ' . $this->order->order_number)
                    ->line('**Customer:** ' . $this->order->user->name)
                    ->line('**Total Amount:** Rp ' . $amount)
                    ->action('View Order Details', url('/admin/orders/' . $this->order->id))
                    ->line('Please check the dashboard for more details.');
    }
}
