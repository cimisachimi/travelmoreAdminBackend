@php
    use App\Models\CarRental;
    use App\Models\HolidayPackage;
    use App\Models\OpenTrip;
    use App\Models\Activity;
    use App\Models\TripPlanner;

    $booking = $order->booking;
    $bookable = $booking ? $booking->bookable : null;
    $details = $booking->details ?? [];

    // --- 1. KALKULASI PESERTA (ROBUST) ---
    $adults = (int)($details['adults'] ?? $details['pax_adults'] ?? 0);
    $children = (int)($details['children'] ?? $details['kids'] ?? $details['pax_kids'] ?? 0);
    $teens = (int)($details['teens'] ?? $details['pax_teens'] ?? 0);
    $seniors = (int)($details['seniors'] ?? $details['pax_seniors'] ?? 0);
    $totalPaxCount = $details['total_pax'] ?? $details['pax_total'] ?? $details['quantity'] ?? ($adults + $children + $teens + $seniors);

    if ($totalPaxCount <= 0) {
        $totalPaxCount = $order->orderItems->sum('quantity');
    }

    // --- 2. JADWAL & LOGISTIK ---
    $meetingPoint = $details['meeting_point'] ?? $details['pickup_location'] ?? $details['pickup_address'] ?? 'Tidak Ditentukan';
    $dropoffLocation = $details['dropoff_location'] ?? 'Sama dengan lokasi jemput';
    $duration = $details['duration'] ?? $details['total_days'] ?? $bookable->duration ?? '1';

    $tripStart = $booking->start_date ?? $booking->booking_date ?? $details['trip_start'] ?? $details['departure_date'] ?? $details['booked_for'] ?? null;
    $dateStr = $tripStart ? \Carbon\Carbon::parse($tripStart)->format('d M Y') : 'TBA';

    // --- 3. DETEKSI NOMOR TELEPON ---
    $phone = $details['whatsapp'] ?? $details['phone_number'] ?? $details['phone'] ?? $order->user->phone_number ?? $order->user->phone ?? 'Tidak ada nomor';

    // --- 4. LOGIKA PEMBAYARAN ---
    $totalAmount = (float)$order->total_amount;
    $paidAmount = (float)($order->paid_amount > 0 ? $order->paid_amount : (in_array($order->status, ['paid', 'settlement']) ? $totalAmount : 0));

    $isFailed = in_array($order->status, ['failed', 'failure', 'cancelled', 'expire']);
    $isSettled = in_array($order->status, ['paid', 'settlement', 'capture']);
    $isPartial = $paidAmount > 0 && $paidAmount < $totalAmount && !$isFailed;

    if ($isFailed) {
        $statusLabel = "GAGAL / DIBATALKAN";
        $statusColor = "#ef4444";
    } elseif ($isPartial) {
        $statusLabel = "DOWN PAYMENT (DP)";
        $statusColor = "#f59e0b";
    } elseif ($isSettled) {
        $statusLabel = "LUNAS ✅";
        $statusColor = "#16a34a";
    } else {
        $statusLabel = "MENUNGGU PEMBAYARAN";
        $statusColor = "#64748b";
    }

    $addonsList = $details['selected_addons'] ?? $details['addons'] ?? [];
@endphp

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; font-family:Arial, sans-serif; margin: 0 auto;">
    {{-- HEADER --}}
    <tr>
        <td style="background-color:#0f172a; padding:20px;">
            <table width="100%">
                <tr>
                    <td style="font-size:18px; font-weight:bold; color:#ffffff; text-transform:uppercase;">
                        🚨 Notifikasi Pesanan Baru
                    </td>
                    <td align="right" style="color:#94a3b8; font-size:12px;">ID: #{{ $order->order_number }}</td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- SUMMARY BAR --}}
    <tr style="background-color:#f8fafc;">
        <td style="padding:15px 25px; border-bottom:1px solid #e2e8f0;">
            <table width="100%">
                <tr>
                    <td width="33%">
                        <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Total Peserta</p>
                        <p style="margin:2px 0 0; font-weight:bold; color:#1e293b;">{{ $totalPaxCount }} Pax</p>
                    </td>
                    <td width="33%" align="center">
                        <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">
                            {{ $bookable instanceof CarRental ? 'Tgl Penjemputan' : 'Tgl Perjalanan' }}
                        </p>
                        <p style="margin:2px 0 0; font-weight:bold; color:#1e293b;">{{ $dateStr }}</p>
                    </td>
                    <td width="33%" align="right">
                        <p style="margin:0; font-size:10px; color:#64748b; text-transform:uppercase;">Status Bayar</p>
                        <p style="margin:2px 0 0; font-weight:bold; color:{{ $statusColor }};">{{ $statusLabel }}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- BODY CONTENT --}}
    <tr>
        <td style="padding:25px;">
            {{-- DATA PELANGGAN & LOGISTIK --}}
            <table width="100%" style="margin-bottom:25px; background-color:#f1f5f9; border-radius:6px; padding:15px;">
                <tr>
                    <td width="45%" valign="top">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Kontak Pelanggan</p>
                        <p style="margin:5px 0 0; font-weight:bold; color:#1e293b; font-size:14px;">{{ $order->user->name }}</p>
                        <p style="margin:2px 0 0; color:#2563eb; font-size:13px; font-weight:bold;">📞 {{ $phone }}</p>
                    </td>
                    <td width="55%" align="right" valign="top">
                        <p style="margin:0; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">
                            @if($bookable instanceof TripPlanner) Area Tujuan
                            @elseif($bookable instanceof OpenTrip) Logistik Trip
                            @elseif($bookable instanceof Activity) Jadwal Aktivitas
                            @elseif($bookable instanceof CarRental) Jadwal Sewa
                            @else Jadwal Perjalanan @endif
                        </p>
                        <div style="font-size:12px; color:#1e293b; line-height:1.6; margin-top:5px;">
                            @if($bookable instanceof TripPlanner)
                                📍 {{ ($bookable->city ? $bookable->city . ', ' : '') . ($bookable->province ?? 'Lokasi Custom') }}<br>
                                📅 Keberangkatan: {{ $dateStr }}
                            @elseif($bookable instanceof Activity)
                                <strong>Tanggal:</strong> {{ $dateStr }}<br>
                                <strong>Waktu:</strong> {{ $details['activity_time'] ?? 'Fleksibel' }}<br>
                                <strong>Titik Jemput:</strong> {{ $meetingPoint }}
                            @elseif($bookable instanceof OpenTrip)
                                <strong>Tanggal Trip:</strong> {{ $dateStr }}<br>
                                <strong>Titik Kumpul:</strong> {{ $meetingPoint }}<br>
                                <strong>Durasi:</strong> {{ $duration }} Hari
                            @elseif($bookable instanceof CarRental)
                                <strong>Penjemputan:</strong> {{ $dateStr }} ({{ $details['pickup_time'] ?? 'TBA' }})<br>
                                <strong>Titik Jemput:</strong> {{ $meetingPoint }}<br>
                                <strong>Titik Pengantaran:</strong> {{ $dropoffLocation }}
                            @else
                                <strong>Tgl Mulai:</strong> {{ $dateStr }}<br>
                                <strong>Titik Jemput:</strong> {{ $meetingPoint }}<br>
                                <strong>Durasi:</strong> {{ $duration }} Hari
                            @endif
                        </div>
                    </td>
                </tr>

                {{-- DETAIL & PREFERENSI --}}
                <tr>
                    <td colspan="2" style="padding-top:15px; border-top:1px solid #e2e8f0; margin-top:10px;">
                        <p style="margin:0 0 8px; font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold;">Detail Tambahan:</p>
                        <table width="100%" style="font-size:12px; color:#475569;">
                            @if($bookable instanceof TripPlanner)
                                <tr><td><strong>Travel Style:</strong></td><td align="right">{{ is_array($bookable->travel_style) ? implode(', ', $bookable->travel_style) : $bookable->travel_style }}</td></tr>
                                <tr><td><strong>Budget:</strong></td><td align="right">{{ $bookable->budget_pack }}</td></tr>
                            @elseif($bookable instanceof HolidayPackage || $bookable instanceof OpenTrip)
                                <tr><td><strong>Tipe Kamar:</strong></td><td align="right">{{ $details['room_type'] ?? 'Standard' }}</td></tr>
                                <tr><td><strong>Diet/Alergi:</strong></td><td align="right">{{ $details['dietary'] ?? 'Tidak ada' }}</td></tr>
                            @elseif($bookable instanceof CarRental)
                                <tr><td><strong>Kendaraan:</strong></td><td align="right">{{ $bookable->brand }} {{ $bookable->car_model }}</td></tr>
                                <tr><td><strong>Tipe Layanan:</strong></td><td align="right">Private (Termasuk Driver)</td></tr>
                            @endif
                        </table>
                    </td>
                </tr>
            </table>

            {{-- TABEL LAYANAN --}}
            <table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px; border:1px solid #f1f5f9;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th align="left" style="font-size:11px; color:#475569; text-transform:uppercase;">Item Layanan</th>
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
                                        $displayName = "Add-on: " . ($addon['name'] ?? $addon['title'] ?? 'Layanan Ekstra');
                                        break;
                                    }
                                }
                            }
                            if (!$displayName) {
                                $displayName = $item->name ?? $item->orderable->name ?? $item->orderable->title ?? "Item Layanan";
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
                        <td colspan="2" align="right" style="padding:15px 12px 5px; font-size:12px; color:#64748b;">Total Tagihan:</td>
                        <td align="right" style="padding:15px 12px 5px; font-size:14px; font-weight:bold; color:#1e293b;">Rp {{ number_format($totalAmount, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td colspan="2" align="right" style="padding:0 12px 5px; font-size:12px; color:#16a34a;">Telah Dibayar:</td>
                        <td align="right" style="padding:0 12px 5px; font-size:14px; font-weight:bold; color:#16a34a;">Rp {{ number_format($paidAmount, 0, ',', '.') }}</td>
                    </tr>
                    @if($isPartial && !$isFailed)
                        <tr>
                            <td colspan="2" align="right" style="padding:0 12px 15px; font-size:12px; color:#f59e0b;">Sisa Tagihan:</td>
                            <td align="right" style="padding:0 12px 15px; font-size:14px; font-weight:bold; color:#f59e0b;">Rp {{ number_format($totalAmount - $paidAmount, 0, ',', '.') }}</td>
                        </tr>
                    @endif
                </tfoot>
            </table>

            {{-- TOMBOL KE DASHBOARD --}}
            <div style="text-align:center; margin-top:20px;">
                <a href="{{ config('app.url') }}/admin/orders/{{ $order->id }}" style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:13px;">
                    Buka Pesanan di Dashboard Admin
                </a>
            </div>
        </td>
    </tr>

    {{-- FOOTER --}}
    <tr>
        <td style="background:#f1f5f9; padding:20px; text-align:center; font-size:11px; color:#64748b;">
            Ini adalah email otomatis. Silakan login ke dashboard untuk melakukan follow-up kepada pelanggan.
        </td>
    </tr>
</table>
