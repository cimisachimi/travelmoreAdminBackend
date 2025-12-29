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

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        // Memuat relasi agar data lengkap saat diproses oleh Queue (Antrean)
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
        // Menggunakan view Blade khusus admin yang sudah kita buat sebelumnya
        // Subject menggunakan Bahasa Indonesia
        return (new MailMessage)
            ->subject('🚨 Pesanan Baru Diterima: #' . $this->order->order_number)
            ->view('emails.admin.new_order', [
                'order' => $this->order
            ]);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'amount' => $this->order->total_amount,
            'user_name' => $this->order->user->name,
        ];
    }
}
