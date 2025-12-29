@extends('emails.layouts.order_base')

@section('service_intro')
    <p style="color:#475569; line-height:1.6; font-size:15px;">
        You're going on an adventure! You have successfully joined the <strong>"{{ $bookable->name }}"</strong> open trip. Get ready to meet new friends!
    </p>
@endsection

@section('service_footer')
    <tr>
        <td style="padding:0 25px 25px;">
            <div style="padding:15px; background-color:#f0f9ff; border-left:4px solid #0ea5e9; border-radius:4px;">
                <p style="margin:0; font-size:13px; color:#0369a1; font-weight:bold;">Trip Coordination:</p>
                <p style="margin:5px 0 0; font-size:12px; color:#0c4a6e;">
                    A group WhatsApp will be created 2 days before departure. Your Tour Leader will meet you at your <strong>selected meeting point</strong> and share a checklist of items to bring.
                </p>
            </div>
        </td>
    </tr>
@endsection
