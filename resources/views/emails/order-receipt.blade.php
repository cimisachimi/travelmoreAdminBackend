@php
    $booking = $order->booking;
    $dateStr = $order->created_at->format('d M Y');
@endphp

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Receipt</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center">

            {{-- Email Container --}}
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; margin:40px 0; border-radius:8px; overflow:hidden;">

                {{-- Header --}}
                @include('emails.partials.header')

                {{-- Greeting --}}
                <tr>
                    <td style="padding:20px;">
                        <p style="margin:0; font-size:16px; color:#1e293b;">
                            Hi <strong>{{ $order->user->name }}</strong>,
                        </p>
                        <p style="margin:10px 0 0; color:#475569;">
                            Your payment was successful. Here are your booking details:
                        </p>
                    </td>
                </tr>

                {{-- Invoice --}}
                @include('emails.partials.invoice', ['order' => $order])

                {{-- Action Button --}}
                <tr>
                    <td align="center" style="padding:30px;">
                        <a href="https://travelmore-topaz.vercel.app/en/profile?tab=bookings"
                           style="background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold;">
                            Manage My Bookings
                        </a>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="padding:20px; background:#f1f5f9; text-align:center; color:#64748b; font-size:13px;">
                        Thank you for choosing <strong>{{ config('app.name') }}</strong>!
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
