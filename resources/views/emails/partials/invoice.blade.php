@php
    $dateStr = $booking && $booking->start_date
        ? \Carbon\Carbon::parse($booking->start_date)->format('d M Y')
        : 'TBA';

    $pickupLocation = $booking->details['pickup_location'] ?? 'Not Specified';
    $pickupTime = $booking->details['pickup_time'] ?? 'To be scheduled';

    // Calculate total pax from order items
    $totalPax = $order->orderItems->sum('quantity');
@endphp

{{-- OUTER WRAPPER --}}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:20px 0;">
    <tr>
        <td align="center">
            {{-- INNER CONTAINER --}}
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; font-family:Arial, sans-serif;">

                {{-- HEADER --}}
                <tr>
                    <td style="background-color:#1e293b; padding:20px;">
                        <table width="100%">
                            <tr>
                                <td style="font-size:18px; font-weight:bold; color:#ffffff; text-transform:uppercase; letter-spacing:1px;">
                                    Trip Confirmation
                                </td>
                                <td align="right" style="color:#cbd5e1; font-size:12px;">
                                    ID: #{{ $order->order_number }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- TRIP SUMMARY BAR --}}
                <tr>
                    <td style="background-color:#f1f5f9; padding:15px 25px; border-bottom:1px solid #e2e8f0;">
                        <table width="100%">
                            <tr>
                                <td width="33%">
                                    <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Total Guests</p>
                                    <p style="margin:2px 0 0; font-weight:bold; color:#1e293b;">{{ $totalPax }} Pax</p>
                                </td>
                                <td width="33%" align="center">
                                    <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Travel Date</p>
                                    <p style="margin:2px 0 0; font-weight:bold; color:#1e293b;">{{ $dateStr }}</p>
                                </td>
                                <td width="33%" align="right">
                                    <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Status</p>
                                    <p style="margin:2px 0 0; font-weight:bold; color:#16a34a;">PAID ✅</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- BODY CONTENT --}}
                <tr>
                    <td style="padding:25px;">
                        {{-- DETAILS GRID --}}
                        <table width="100%" style="margin-bottom:25px;">
                            <tr>
                                <td width="50%" valign="top" style="padding-right:10px;">
                                    <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Primary Contact</p>
                                    <p style="margin:5px 0 0; font-weight:bold; color:#1e293b; font-size:15px;">{{ $order->user->name }}</p>
                                    <p style="margin:2px 0 0; color:#64748b; font-size:13px;">{{ $order->user->email }}</p>
                                    <p style="margin:2px 0 0; color:#64748b; font-size:13px;">📞 {{ $order->user->phone ?? 'No phone provided' }}</p>
                                </td>
                                <td width="50%" align="right" valign="top">
                                    <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Pickup Schedule (WIB)</p>
                                    <p style="margin:5px 0 0; font-weight:bold; color:#1e293b; font-size:15px;">{{ $pickupTime }} WIB</p>
                                    <p style="margin:2px 0 0; color:#64748b; font-size:13px;">📍 {{ $pickupLocation }}</p>
                                </td>
                            </tr>
                        </table>

                        {{-- SERVICES TABLE --}}
                        <table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px; border:1px solid #f1f5f9;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th align="left" style="font-size:11px; color:#475569; border-bottom:1px solid #e2e8f0; text-transform:uppercase;">Package / Activity</th>
                                    <th align="center" style="font-size:11px; color:#475569; border-bottom:1px solid #e2e8f0; text-transform:uppercase;">Pax</th>
                                    <th align="right" style="font-size:11px; color:#475569; border-bottom:1px solid #e2e8f0; text-transform:uppercase;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($order->orderItems as $item)
                                <tr>
                                    <td style="border-bottom:1px solid #f1f5f9; font-size:14px; color:#334155;">
                                        {{ $item->orderable->name ?? $item->orderable->title ?? 'Service' }}
                                    </td>
                                    <td align="center" style="border-bottom:1px solid #f1f5f9; font-size:14px; color:#334155;">
                                        {{ $item->quantity }}
                                    </td>
                                    <td align="right" style="border-bottom:1px solid #f1f5f9; font-size:14px; font-weight:bold; color:#1e293b;">
                                        Rp {{ number_format($item->price, 0, ',', '.') }}
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" align="right" style="padding:15px 12px 5px; font-size:13px; color:#64748b;">Grand Total:</td>
                                    <td align="right" style="padding:15px 12px 5px; font-size:16px; font-weight:bold; color:#1e293b;">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" align="right" style="padding:0 12px 15px; font-size:13px; color:#16a34a;">Amount Paid:</td>
                                    <td align="right" style="padding:0 12px 15px; font-size:16px; font-weight:bold; color:#16a34a;">Rp {{ number_format($order->paid_amount, 0, ',', '.') }}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {{-- IMPORTANT NOTES --}}
                        <div style="padding:15px; background-color:#fff9f0; border-left:4px solid #f59e0b; border-radius:4px;">
                            <p style="margin:0; font-size:12px; color:#92400e; line-height:1.5;">
                                <strong>Trip Notice:</strong> Please arrive at the pickup location 15 minutes before the scheduled time. Don't forget to bring your ID/E-ticket and personal belongings.
                            </p>
                        </div>
                    </td>
                </tr>

                {{-- WHATSAPP VERIFICATION --}}
                <tr>
                    <td style="background:#f0fdf4; padding:25px; border-top:1px solid #dcfce7; text-align:center;">
                        <p style="margin:0 0 5px; font-size:14px; font-weight:bold; color:#166534;">Is your WhatsApp number correct?</p>
                        <p style="margin:0 0 15px; font-size:12px; color:#15803d;">We will use WhatsApp to send the final driver details and exact meeting point.</p>
                        <a href="{{ $waUrl }}"
                           style="display:inline-block; background:#25D366; color:#ffffff; padding:12px 25px;
                                  text-decoration:none; border-radius:6px; font-weight:bold; font-size:13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            No, click here to update my number
                        </a>
                    </td>
                </tr>
            </table>
            {{-- FOOTER TEXT --}}
            <p style="margin:20px 0 0; font-size:11px; color:#94a3b8; text-align:center;">
                © {{ date('Y') }} Travelmore.travel. This is an automated booking confirmation.
            </p>
        </td>
    </tr>
</table>
