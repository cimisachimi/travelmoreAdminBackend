@extends('emails.layouts.order_base')

@section('service_intro')
    <p style="color:#475569; line-height:1.5;">
        Your booking for <strong>{{ $bookable->name }}</strong> is confirmed. We've blocked your slot for this experience.
    </p>
@endsection

@section('service_footer')
    <tr>
        <td style="padding:0 25px 25px;">
            <div style="padding:15px; background-color:#fff7ed; border-left:4px solid #ea580c; border-radius:4px;">
                <p style="margin:0; font-size:13px; color:#9a3412; font-weight:bold;">Activity Notes:</p>
                <p style="margin:5px 0 0; font-size:12px; color:#c2410c;">
                    {!! nl2br(e($bookable->notes)) !!} {{-- Pulls specific notes from the Activity model --}}
                </p>
            </div>
        </td>
    </tr>
@endsection
