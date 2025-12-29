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

    // --- 5. ADDONS LIST FOR PRICE MATCHING ---
    $addonsList = $details['selected_addons'] ?? $details['addons'] ?? [];
@endphp

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; font-family:Arial, sans-serif; margin: 0 auto;">
    {{-- HEADER --}}
    <tr>
        <td style="background-color:#1e293b; padding:20px;">
            <table width="100%">
                <tr>
                    <td style="font-size:18px; font-weight:bold; color:#ffffff; text-transform:uppercase;">
                        @if($bookable instanceof TripPlanner) Request Confirmation
                        @elseif($bookable instanceof Activity) Activity Confirmation
                        @elseif($bookable instanceof HolidayPackage) Holiday Confirmation
                        @elseif($bookable instanceof OpenTrip) Open Trip Confirmation
                        @elseif($bookable instanceof CarRental) Rental Confirmation
                        @else Trip Confirmation @endif
                    </td>
                    <td align="right" style="color:#cbd5e1; font-size:12px;">ID: #{{ $order->order_number }}</td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- SUMMARY BAR --}}
    <tr style="background-color:#f1f5f9;">
        <td style="padding:15px 25px; border-bottom:1px solid #e2e8f0;">
            <table width="100%">
                <tr>
                    <td width="33%">
                        <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Total Guests</p>
                        <p style="margin:2px 0 0; font-weight:bold; color:#1e293b;">{{ $totalPaxCount }} Pax</p>
                    </td>
                    <td width="33%" align="center">
                        <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">
                            {{ $bookable instanceof CarRental ? 'Pickup Date' : 'Travel Date' }}
                        </p>
                        <p style="margin:2px 0 0; font-weight:bold; color:#1e293b;">{{ $dateStr }}</p>
                    </td>
                    <td width="33%" align="right">
                        <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Status</p>
                        <p style="margin:2px 0 0; font-weight:bold; color:{{ $statusColor }};">{{ $statusLabel }}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- BODY CONTENT --}}
    <tr>
        <td style="padding:25px;">
            {{-- CONTACT & LOCATION GRID --}}
            <table width="100%" style="margin-bottom:25px; background-color:#f8fafc; border-radius:6px; padding:15px;">
                <tr>
                    <td width="45%" valign="top">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Primary Contact</p>
                        <p style="margin:5px 0 0; font-weight:bold; color:#1e293b; font-size:14px;">{{ $order->user->name }}</p>
                        <p style="margin:2px 0 0; color:#2563eb; font-size:13px; font-weight:bold;">📞 {{ $phone }}</p>
                    </td>
                    <td width="55%" align="right" valign="top">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">
                            @if($bookable instanceof TripPlanner) Destination Area
                            @elseif($bookable instanceof OpenTrip) Trip Logistics
                            @elseif($bookable instanceof Activity) Activity Schedule
                            @elseif($bookable instanceof CarRental) Rental Schedule
                            @else Travel Schedule @endif
                        </p>
                        <div style="font-size:12px; color:#1e293b; line-height:1.6; margin-top:5px;">
                            @if($bookable instanceof TripPlanner)
                                📍 {{ ($bookable->city ? $bookable->city . ', ' : '') . ($bookable->province ?? 'Custom Location') }}<br>
                                📅 Departure: {{ $dateStr }}
                            @elseif($bookable instanceof Activity)
                                <strong>Date:</strong> {{ $dateStr }}<br>
                                <strong>Preferred Time:</strong> {{ $details['activity_time'] ?? 'Flexible' }}<br>
                                <strong>Pickup Point:</strong> {{ $meetingPoint }}
                            @elseif($bookable instanceof OpenTrip)
                                <strong>Trip Date:</strong> {{ $dateStr }}<br>
                                <strong>Meeting Point:</strong> {{ $meetingPoint }}<br>
                                <strong>Duration:</strong> {{ $duration }} Days
                            @elseif($bookable instanceof CarRental)
                                <strong>Pickup:</strong> {{ $dateStr }} ({{ $details['pickup_time'] ?? 'TBA' }})<br>
                                <strong>Pickup Point:</strong> {{ $meetingPoint }}<br>
                                <strong>Drop-off Point:</strong> {{ $dropoffLocation }}
                            @else
                                <strong>Trip Start Date:</strong> {{ $dateStr }}<br>
                                <strong>Pickup Point:</strong> {{ $meetingPoint }}<br>
                                <strong>Flight Num:</strong> {{ $flightNum }}<br>
                                <strong>Duration:</strong> {{ $duration }} Days
                            @endif
                        </div>
                    </td>
                </tr>

                {{-- DYNAMIC PREFERENCES --}}
                <tr>
                    <td colspan="2" style="padding-top:15px; border-top:1px solid #e2e8f0; margin-top:10px;">
                        <p style="margin:0 0 8px; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Details & Preferences:</p>
                        <table width="100%" style="font-size:12px; color:#475569;">
                            @if($bookable instanceof TripPlanner)
                                <tr><td><strong>Travel Style:</strong></td><td align="right">{{ is_array($bookable->travel_style) ? implode(', ', $bookable->travel_style) : $bookable->travel_style }}</td></tr>
                                <tr><td><strong>Budget Tier:</strong></td><td align="right">{{ $bookable->budget_pack }}</td></tr>
                                <tr><td><strong>Trip Duration:</strong></td><td align="right">{{ $bookable->duration }} Days</td></tr>
                            @elseif($bookable instanceof Activity)
                                <tr><td><strong>Nationality:</strong></td><td align="right">{{ $details['participant_nationality'] ?? 'Not Specified' }}</td></tr>
                                <tr><td><strong>Activity Time:</strong></td><td align="right">{{ $details['activity_time'] ?? 'Flexible' }}</td></tr>
                            @elseif($bookable instanceof HolidayPackage || $bookable instanceof OpenTrip)
                                <tr><td><strong>Room Preference:</strong></td><td align="right">{{ $details['room_type'] ?? 'Standard' }}</td></tr>
                                <tr><td><strong>Dietary Requirements:</strong></td><td align="right">{{ $details['dietary'] ?? 'None' }}</td></tr>
                            @elseif($bookable instanceof CarRental)
                                <tr><td><strong>Vehicle Selected:</strong></td><td align="right">{{ $bookable->brand }} {{ $bookable->car_model }}</td></tr>
                                <tr><td><strong>Rental Duration:</strong></td><td align="right">{{ $duration }} Days</td></tr>
                                <tr><td><strong>Service Type:</strong></td><td align="right">Private Charter (Driver Included)</td></tr>
                            @endif
                        </table>
                    </td>
                </tr>
            </table>

            {{-- INVOICE ITEMS --}}
            <table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px; border:1px solid #f1f5f9;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th align="left" style="font-size:11px; color:#475569; text-transform:uppercase;">Service / Add-on</th>
                        <th align="center" style="font-size:11px; color:#475569; text-transform:uppercase;">Qty</th>
                        <th align="right" style="font-size:11px; color:#475569; text-transform:uppercase;">Subtotal</th>
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
                        if (!$displayName) {
                            $displayName = $item->name
                                           ?? $item->orderable->name
                                           ?? $item->orderable->title
                                           ?? $details['service_name']
                                           ?? (isset($details['brand']) ? $details['brand'].' '.$details['car_model'] : null)
                                           ?? "Service Item";
                        }
                    @endphp
                    <tr>
                        <td style="border-bottom:1px solid #f1f5f9;">
                            <div style="font-size:14px; font-weight:bold; color:#334155;">{{ $displayName }}</div>
                        </td>
                        <td align="center" style="border-bottom:1px solid #f1f5f9;">{{ $item->quantity }}</td>
                        <td align="right" style="border-bottom:1px solid #f1f5f9; font-weight:bold;">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" align="right" style="padding:15px 12px 5px; font-size:13px; color:#64748b;">Grand Total:</td>
                        <td align="right" style="padding:15px 12px 5px; font-size:16px; font-weight:bold; color:#1e293b;">Rp {{ number_format($totalAmount, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td colspan="2" align="right" style="padding:0 12px 5px; font-size:13px; color:#16a34a;">Amount Paid:</td>
                        <td align="right" style="padding:0 12px 5px; font-size:16px; font-weight:bold; color:#16a34a;">Rp {{ number_format($paidAmount, 0, ',', '.') }}</td>
                    </tr>
                    @if($isPartial && !$isFailed)
                    <tr>
                        <td colspan="2" align="right" style="padding:0 12px 15px; font-size:13px; color:#f59e0b;">Balance Due:</td>
                        <td align="right" style="padding:0 12px 15px; font-size:16px; font-weight:bold; color:#f59e0b;">Rp {{ number_format($totalAmount - $paidAmount, 0, ',', '.') }}</td>
                    </tr>
                    @endif
                </tfoot>
            </table>

            {{-- GUIDELINES BLOCK --}}
            <div style="padding:15px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; margin-top:10px;">
                <p style="margin:0 0 8px; font-size:11px; color:#1e293b; font-weight:bold; text-transform:uppercase;">Rental Guidelines:</p>
                <ul style="margin:0; padding:0 0 0 15px; font-size:11px; color:#475569; line-height:1.5;">
                    @if($bookable instanceof CarRental)
                        <li><strong>Driver Included:</strong> A professional driver is provided for your entire trip duration.</li>
                        <li><strong>Fuel & Extra Costs:</strong> Fuel, parking fees, and tolls are to be covered by the guest unless otherwise specified.</li>
                        <li><strong>Driver Meals:</strong> It is customary to provide meals or a small allowance for the driver during travel.</li>
                        <li><strong>Overtime:</strong> Use exceeding the agreed duration is charged at 10% of the daily rate per hour.</li>
                    @else
                        <li>Please be ready 15 minutes before the scheduled time.</li>
                        <li>Ensure you have your digital receipt or ID ready for verification.</li>
                    @endif
                </ul>
            </div>

            @if($isFailed)
            <div style="padding:15px; background:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; margin-top:10px;">
                <p style="margin:0; font-size:12px; color:#b91c1c;">
                    <strong>Payment Alert:</strong> This transaction has been cancelled or failed. Please contact our support team or create a new booking if you would like to proceed.
                </p>
            </div>
            @endif
        </td>
    </tr>

    {{-- WHATSAPP CONTACT SECTION --}}
    <tr>
        <td style="background:#f0fdf4; padding:25px; border-top:1px solid #dcfce7; text-align:center;">
            <p style="margin:0 0 12px; font-size:13px; font-weight:bold; color:#166534; line-height:1.4;">
                Make sure your WhatsApp can be contacted if you cannot contact us here using WhatsApp
            </p>
            <a href="{{ $waUrl }}" style="display:inline-block; background:#25D366; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:13px;">
                Update WhatsApp Number
            </a>
        </td>
    </tr>
</table>
