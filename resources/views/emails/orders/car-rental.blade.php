@extends('emails.layouts.order_base')

@section('service_intro')
    <p style="color:#475569; line-height:1.5;">
        Your car rental for the <strong>{{ $bookable->brand }} {{ $bookable->car_model }}</strong> is confirmed! Please ensure you have your original ID and Driver's License ready for the handover.
    </p>
@endsection

@section('service_footer')
    <tr>
        <td style="padding:0 25px 25px;">
            <div style="padding:15px; background-color:#f0f9ff; border-left:4px solid #0ea5e9; border-radius:4px;">
                <p style="margin:0; font-size:13px; color:#0369a1; font-weight:bold;">Rental Guidelines:</p>
                <ul style="margin:5px 0 0; padding-left:20px; font-size:12px; color:#0c4a6e;">

                </ul>
            </div>
        </td>
    </tr>
@endsection
