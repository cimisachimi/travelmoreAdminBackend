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
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; margin:40px 0; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0;">
                    {{-- Header Partial --}}
                    @include('emails.partials.header')

                    {{-- Greeting and Service Header --}}
                    <tr>
                        <td style="padding:20px;">
                            <p style="margin:0; font-size:16px; color:#1e293b;">
                                Hi <strong>{{ $order->user->name }}</strong>,
                            </p>
                            <div style="margin-top:10px;">
                                @yield('service_intro')
                            </div>
                        </td>
                    </tr>

                    {{-- Main Invoice Content --}}
                    <tr>
                        <td>
                            @include('emails.partials.invoice', ['order' => $order])
                        </td>
                    </tr>

                    {{-- Service Specific Footer Info --}}
                    @yield('service_footer')

                    {{-- Action Button --}}
                    <tr>
                        <td align="center" style="padding:30px;">
                            <a href="https://travelmore-topaz.vercel.app/en/profile?tab=bookings"
                               style="background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; display:inline-block;">
                                Manage My Bookings
                            </a>
                        </td>
                    </tr>

                    {{-- Global Footer Partial --}}
                    @include('emails.partials.footer')
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
