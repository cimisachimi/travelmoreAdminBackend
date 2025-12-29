@php
    use App\Models\CarRental;
    use App\Models\HolidayPackage;
    use App\Models\OpenTrip;
    use App\Models\Activity;
    use App\Models\TripPlanner;

    $booking = $order->booking;
    $bookable = $booking ? $booking->bookable : null;
    $details = $booking->details ?? [];

    // --- 1. ROBUST PAX CALCULATION ---
    $adults = (int)($details['adults'] ?? $details['pax_adults'] ?? 0);
    $children = (int)($details['children'] ?? $details['kids'] ?? $details['pax_kids'] ?? 0);
    $teens = (int)($details['teens'] ?? $details['pax_teens'] ?? 0);
    $seniors = (int)($details['seniors'] ?? $details['pax_seniors'] ?? 0);
    $totalPaxCount = $details['total_pax'] ?? $details['pax_total'] ?? $details['quantity'] ?? ($adults + $children + $teens + $seniors);

    if ($totalPaxCount <= 0) {
        $totalPaxCount = $order->orderItems->sum('quantity');
    }

    // --- 2. TRAVEL SCHEDULE & LOGISTICS ---
    $meetingPoint = $details['meeting_point'] ?? $details['pickup_location'] ?? $details['pickup_address'] ?? 'Not Specified';
    $dropoffLocation = $details['dropoff_location'] ?? 'Same as pickup area';
    $flightNum = $details['flight_number'] ?? $details['flight_num'] ?? 'Not Provided';
    $duration = $details['duration'] ?? $details['total_days'] ?? $bookable->duration ?? '1';

    $tripStart = $booking->start_date ?? $booking->booking_date ?? $details['trip_start'] ?? $details['departure_date'] ?? $details['booked_for'] ?? null;
    $dateStr = $tripStart ? \Carbon\Carbon::parse($tripStart)->format('d M Y') : 'TBA';

    // --- 3. PHONE DETECTION ---
    $phone = $details['whatsapp'] ?? $details['phone_number'] ?? $details['phone'] ?? $order->user->phone_number ?? $order->user->phone ?? 'Not provided';

    // --- 4. ADVANCED PAYMENT STATUS LOGIC ---
    $totalAmount = (float)$order->total_amount;
    $paidAmount = (float)($order->paid_amount > 0 ? $order->paid_amount : (in_array($order->status, ['paid', 'settlement']) ? $totalAmount : 0));

    $isFailed = in_array($order->status, ['failed', 'failure', 'cancelled', 'expire']);
    $isSettled = in_array($order->status, ['paid', 'settlement', 'capture']);
    $isPartial = $paidAmount > 0 && $paidAmount < $totalAmount && !$isFailed;

    if ($isFailed) {
        $statusLabel = "FAILED / CANCELLED";
        $statusColor = "#ef4444";
    } elseif ($isPartial) {
        $statusLabel = "DOWN PAYMENT";
        $statusColor = "#f59e0b";
    } elseif ($isSettled) {
        $statusLabel = "PAID ✅";
        $statusColor = "#16a34a";
    } else {
        $statusLabel = "PENDING PAYMENT";
        $statusColor = "#64748b";
    }

    $addonsList = $details['selected_addons'] ?? $details['addons'] ?? [];
@endphp

{{-- MAIN CONTAINER: WIDER 850px FOR MEDIUM VIEW --}}
<table width="850" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; font-family:Arial, sans-serif; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

    {{-- DYNAMIC HEADER --}}
    <tr>
        <td style="background-color:#1e293b; padding:30px 40px;">
            <table width="100%">
                <tr>
                    <td style="font-size:22px; font-weight:bold; color:#ffffff; text-transform:uppercase; letter-spacing: -0.5px;">
                        @if($bookable instanceof TripPlanner) Trip Request Confirmation
                        @elseif($bookable instanceof Activity) Activity Confirmation
                        @elseif($bookable instanceof HolidayPackage) Holiday Confirmation
                        @elseif($bookable instanceof OpenTrip) Open Trip Confirmation
                        @elseif($bookable instanceof CarRental) Rental Confirmation
                        @else Booking Confirmation @endif
                    </td>
                    <td align="right" style="color:#94a3b8; font-size:13px; font-family: monospace;">ID: #{{ $order->order_number }}</td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- STATS SUMMARY BAR --}}
    <tr style="background-color:#f8fafc; border-bottom:1px solid #e2e8f0;">
        <td style="padding:20px 40px;">
            <table width="100%">
                <tr>
                    <td width="33%" style="border-right: 1px solid #e2e8f0;">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Total Guests</p>
                        <p style="margin:4px 0 0; font-size:18px; font-weight:bold; color:#1e293b;">{{ $totalPaxCount }} Pax</p>
                    </td>
                    <td width="33%" align="center" style="border-right: 1px solid #e2e8f0;">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">
                            {{ $bookable instanceof CarRental ? 'Pickup Date' : 'Travel Date' }}
                        </p>
                        <p style="margin:4px 0 0; font-size:18px; font-weight:bold; color:#1e293b;">{{ $dateStr }}</p>
                    </td>
                    <td width="33%" align="right">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Payment Status</p>
                        <p style="margin:4px 0 0; font-size:18px; font-weight:bold; color:{{ $statusColor }};">{{ $statusLabel }}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- DUAL COLUMN BODY --}}
    <tr>
        <td style="padding:40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    {{-- COLUMN 1: CONTACT --}}
                    <td width="48%" valign="top" style="padding-right:20px;">
                        <h4 style="margin:0 0 15px; font-size:12px; color:#94a3b8; text-transform:uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Primary Contact</h4>
                        <p style="margin:0; font-weight:bold; color:#1e293b; font-size:18px;">{{ $order->user->name }}</p>
                        <p style="margin:8px 0 0; color:#2563eb; font-size:15px; font-weight:bold;">📞 {{ $phone }}</p>

                        <div style="margin-top:25px; padding:20px; background:#f8fafc; border-radius:10px; border:1px solid #f1f5f9;">
                            <p style="margin:0 0- 10px; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Details & Preferences:</p>
                            <table width="100%" style="font-size:13px; color:#475569; line-height: 2;">
                                @if($bookable instanceof TripPlanner)
                                    <tr><td><strong>Style:</strong></td><td align="right">{{ is_array($bookable->travel_style) ? implode(', ', $bookable->travel_style) : $bookable->travel_style }}</td></tr>
                                    <tr><td><strong>Budget:</strong></td><td align="right">{{ $bookable->budget_pack }}</td></tr>
                                @elseif($bookable instanceof HolidayPackage || $bookable instanceof OpenTrip)
                                    <tr><td><strong>Room:</strong></td><td align="right">{{ $details['room_type'] ?? 'Standard' }}</td></tr>
                                    <tr><td><strong>Dietary:</strong></td><td align="right">{{ $details['dietary'] ?? 'None' }}</td></tr>
                                @elseif($bookable instanceof CarRental)
                                    <tr><td><strong>Vehicle:</strong></td><td align="right">{{ $bookable->brand }} {{ $bookable->car_model }}</td></tr>
                                    <tr><td><strong>Type:</strong></td><td align="right">Private Charter</td></tr>
                                @endif
                                @if(!empty($details['special_request']))
                                    <tr><td colspan="2" style="border-top:1px dashed #cbd5e1; padding-top:5px; margin-top:5px; font-style:italic;">"{{ $details['special_request'] }}"</td></tr>
                                @endif
                            </table>
                        </div>
                    </td>

                    {{-- COLUMN 2: LOGISTICS --}}
                    <td width="4%" style="border-left: 1px solid #f1f5f9;">&nbsp;</td>
                    <td width="48%" valign="top" style="padding-left:10px;">
                        <h4 style="margin:0 0 15px; font-size:12px; color:#94a3b8; text-transform:uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                            @if($bookable instanceof CarRental) Rental Schedule @else Trip Logistics @endif
                        </h4>
                        <table width="100%" style="font-size:14px; color:#1e293b; line-height: 2;">
                            @if($bookable instanceof TripPlanner)
                                <tr><td width="35%" style="color:#64748b;">📍 Destination:</td><td style="font-weight:bold;">{{ $bookable->city ?? 'Custom' }}</td></tr>
                                <tr><td style="color:#64748b;">📅 Departure:</td><td style="font-weight:bold;">{{ $dateStr }}</td></tr>
                                <tr><td style="color:#64748b;">⏳ Duration:</td><td style="font-weight:bold;">{{ $bookable->duration }} Days</td></tr>
                            @elseif($bookable instanceof CarRental)
                                <tr><td width="35%" style="color:#64748b;">🕒 Pickup Time:</td><td style="font-weight:bold;">{{ $details['pickup_time'] ?? 'TBA' }}</td></tr>
                                <tr><td style="color:#64748b;">📍 Pickup:</td><td style="font-weight:bold;">{{ $meetingPoint }}</td></tr>
                                <tr><td style="color:#64748b;">🏁 Drop-off:</td><td style="font-weight:bold;">{{ $dropoffLocation }}</td></tr>
                            @else
                                <tr><td width="35%" style="color:#64748b;">📅 Trip Date:</td><td style="font-weight:bold;">{{ $dateStr }}</td></tr>
                                <tr><td style="color:#64748b;">📍 Meeting:</td><td style="font-weight:bold;">{{ $meetingPoint }}</td></tr>
                                <tr><td style="color:#64748b;">⏳ Duration:</td><td style="font-weight:bold;">{{ $duration }} Days</td></tr>
                            @endif
                        </table>
                    </td>
                </tr>
            </table>

            {{-- INVOICE ITEMS TABLE --}}
            <div style="margin-top:40px;">
                <h4 style="margin:0 0 15px; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Order Breakdown</h4>
                <table width="100%" cellpadding="15" cellspacing="0" style="border:1px solid #f1f5f9; border-collapse:collapse; border-radius:12px;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th align="left" style="font-size:11px; color:#64748b; text-transform:uppercase;">Description</th>
                            <th align="center" style="font-size:11px; color:#64748b; text-transform:uppercase;">Qty</th>
                            <th align="right" style="font-size:11px; color:#64748b; text-transform:uppercase;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($order->orderItems as $item)
                        @php
                            $displayName = null;
                            if (is_array($addonsList)) {
                                foreach ($addonsList as $addon) {
                                    if (is_array($addon) && isset($addon['price']) && abs((float)$addon['price'] - (float)$item->price) < 1) {
                                        $displayName = "Add-on: " . ($addon['name'] ?? $addon['title'] ?? 'Extra Service');
                                        break;
                                    }
                                }
                            }
                            $displayName = $displayName ?? ($item->name ?? "Service Item");
                        @endphp
                        <tr>
                            <td style="border-bottom:1px solid #f8fafc; font-size:15px; font-weight:bold; color:#334155;">{{ $displayName }}</td>
                            <td align="center" style="border-bottom:1px solid #f8fafc; color:#64748b;">{{ $item->quantity }}</td>
                            <td align="right" style="border-bottom:1px solid #f8fafc; font-weight:bold; color:#1e293b;">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                    <tfoot style="background-color:#fcfcfc;">
                        <tr>
                            <td colspan="2" align="right" style="padding-top:20px; color:#64748b; font-size:14px;">Grand Total:</td>
                            <td align="right" style="padding-top:20px; font-size:22px; font-weight:900; color:#1e293b;">Rp {{ number_format($totalAmount, 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" align="right" style="color:#16a34a; font-size:14px;">Total Paid:</td>
                            <td align="right" style="font-size:16px; font-weight:bold; color:#16a34a;">Rp {{ number_format($paidAmount, 0, ',', '.') }}</td>
                        </tr>
                        @if($isPartial && !$isFailed)
                        <tr>
                            <td colspan="2" align="right" style="color:#f59e0b; font-size:14px;">Remaining Balance:</td>
                            <td align="right" style="font-size:16px; font-weight:bold; color:#f59e0b;">Rp {{ number_format($totalAmount - $paidAmount, 0, ',', '.') }}</td>
                        </tr>
                        @endif
                    </tfoot>
                </table>
            </div>

            {{-- GUIDELINES BLOCK --}}
            <div style="padding:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin-top:30px;">
                <p style="margin:0 0 10px; font-size:12px; color:#1e293b; font-weight:bold; text-transform:uppercase;">Important Guidelines:</p>
                <ul style="margin:0; padding:0 0 0 20px; font-size:12px; color:#475569; line-height:1.6;">
                    @if($bookable instanceof CarRental)
                        <li><strong>Driver:</strong> A professional driver is included for the duration.</li>
                        <li><strong>Extras:</strong> Fuel, parking, and tolls are not included unless stated.</li>
                        <li><strong>Overtime:</strong> Charged at 10% of the daily rate per hour.</li>
                    @else
                        <li>Please arrive at the meeting point 15 minutes early.</li>
                        <li>Have your booking ID (#{{ $order->order_number }}) ready for check-in.</li>
                    @endif
                </ul>
            </div>
        </td>
    </tr>

    {{-- WHATSAPP CONTACT FOOTER --}}
    <tr>
        <td style="background:#f0fdf4; padding:40px; border-top:1px solid #dcfce7; text-align:center;">
            <p style="margin:0 0 20px; font-size:15px; font-weight:bold; color:#166534; line-height:1.5;">
                We will contact you via WhatsApp for final coordination.<br>Please ensure your number is reachable.
            </p>
            <a href="{{ $waUrl }}" style="display:inline-block; background:#25D366; color:#ffffff; padding:16px 35px; text-decoration:none; border-radius:50px; font-weight:bold; font-size:15px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);">
                Verify WhatsApp Number
            </a>
        </td>
    </tr>
</table>
