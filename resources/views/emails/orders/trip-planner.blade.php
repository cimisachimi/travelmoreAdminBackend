@extends('emails.layouts.order_base')

@section('service_intro')
    <p style="color:#475569; line-height:1.5; font-size:15px;">
        Hi <strong>{{ $bookable->full_name }}</strong>, we've received your custom trip planning request! Our travel designers are now reviewing your preferences to craft the perfect itinerary for you.
    </p>
@endsection

@section('service_footer')
    <tr>
        <td style="padding:0 25px 25px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                    <td style="padding:20px;">
                        <p style="margin:0 0 15px; font-size:13px; color:#1e293b; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">
                            📋 Your Trip Requirements
                        </p>

                        <table width="100%" style="font-size:13px; color:#475569; line-height:1.8;">
                            {{-- Group: Basics --}}
                            <tr>
                                <td width="40%" style="color:#64748b;">Pax Breakdown:</td>
                                <td style="font-weight:600; color:#1e293b;">
                                    {{ $bookable->pax_adults }} Adults, {{ $bookable->pax_teens }} Teens, {{ $bookable->pax_kids }} Kids
                                </td>
                            </tr>
                            <tr>
                                <td style="color:#64748b;">Duration & Date:</td>
                                <td style="font-weight:600; color:#1e293b;">
                                    {{ $bookable->duration }} Days (Starting {{ \Carbon\Carbon::parse($bookable->departure_date)->format('d M Y') }})
                                </td>
                            </tr>

                            {{-- Group: Style & Budget --}}
                            <tr><td colspan="2" style="padding-top:10px; border-top:1px solid #f1f5f9;"></td></tr>
                            <tr>
                                <td style="color:#64748b;">Travel Style:</td>
                                <td style="font-weight:600; color:#1e293b;">
                                    {{ is_array($bookable->travel_style) ? implode(', ', $bookable->travel_style) : $bookable->travel_style }}
                                </td>
                            </tr>
                            <tr>
                                <td style="color:#64748b;">Budget Level:</td>
                                <td style="font-weight:600; color:#1e293b;">{{ $bookable->budget_pack }}</td>
                            </tr>

                            {{-- Group: Preferences --}}
                            <tr><td colspan="2" style="padding-top:10px; border-top:1px solid #f1f5f9;"></td></tr>
                            <tr>
                                <td style="color:#64748b;">Activity Level:</td>
                                <td style="font-weight:600; color:#1e293b;">{{ $bookable->activity_level }}</td>
                            </tr>
                            @if($bookable->must_visit)
                            <tr>
                                <td valign="top" style="color:#64748b;">Must Visit:</td>
                                <td style="font-weight:600; color:#1e293b;">{{ $bookable->must_visit }}</td>
                            </tr>
                            @endif
                        </table>
                    </td>
                </tr>
            </table>

            <div style="margin-top:20px; padding:15px; background-color:#fff7ed; border-left:4px solid #ea580c; border-radius:4px;">
                <p style="margin:0; font-size:12px; color:#9a3412;">
                    <strong>Next Step:</strong> Within 48 hours, you will receive a draft itinerary link in your email and WhatsApp for your review.
                </p>
            </div>
        </td>
    </tr>
@endsection
