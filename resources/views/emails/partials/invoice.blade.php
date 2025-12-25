@php
    $booking = $order->booking;
@endphp

<tr>
    <td style="padding:20px;">

        {{-- Invoice Header --}}
        <table width="100%">
            <tr>
                <td style="font-size:18px; font-weight:bold; color:#1e293b;">
                    INVOICE / RECEIPT
                </td>
                <td align="right" style="color:#64748b;">
                    #{{ $order->order_number }}
                </td>
            </tr>
        </table>

        {{-- Billing Info --}}
        <table width="100%" style="margin-top:20px;">
            <tr>
                <td>
                    <p style="margin:0; font-size:12px; color:#64748b;">BILL TO</p>
                    <p style="margin:5px 0 0; font-weight:bold; color:#1e293b;">
                        {{ $order->user->name }}
                    </p>
                </td>
                <td align="right">
                    <p style="margin:0; font-size:12px; color:#64748b;">DATE</p>
                    <p style="margin:5px 0 0; font-weight:bold; color:#1e293b;">
                        {{ $order->created_at->format('d M Y') }}
                    </p>
                </td>
            </tr>
        </table>

        {{-- Items --}}
        <table width="100%" cellpadding="10" cellspacing="0" style="margin-top:20px; border-collapse:collapse;">
            <thead>
                <tr style="background:#f1f5f9;">
                    <th align="left" style="font-size:12px; color:#475569;">Service & Addons</th>
                    <th align="center" style="font-size:12px; color:#475569;">Qty</th>
                    <th align="right" style="font-size:12px; color:#475569;">Price</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($order->orderItems as $item)
                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {{ $item->orderable->name ?? $item->orderable->title ?? 'Service' }}
                        </td>
                        <td align="center" style="border-bottom:1px solid #e2e8f0;">
                            {{ $item->quantity }}
                        </td>
                        <td align="right" style="border-bottom:1px solid #e2e8f0;">
                            Rp {{ number_format($item->price, 0, ',', '.') }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Totals --}}
        <table width="100%" style="margin-top:20px;">
            <tr>
                <td width="60%"></td>
                <td width="40%">
                    <table width="100%">
                        <tr>
                            <td>Total</td>
                            <td align="right" style="font-weight:bold;">
                                Rp {{ number_format($order->total_amount, 0, ',', '.') }}
                            </td>
                        </tr>
                        <tr>
                            <td style="color:#16a34a;">Paid</td>
                            <td align="right" style="font-weight:bold; color:#16a34a;">
                                Rp {{ number_format($order->paid_amount, 0, ',', '.') }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        {{-- WhatsApp Notice --}}
        <div style="margin-top:20px; background:#fff7ed; padding:15px; border-radius:6px; color:#92400e;">
            <strong>WhatsApp Confirmation:</strong>
            We will contact you via WhatsApp for pickup location and time (WIB).
        </div>

    </td>
</tr>
