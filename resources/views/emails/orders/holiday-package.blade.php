@extends('emails.layouts.order_base')

@section('service_intro')
    <p style="color:#475569; line-height:1.6; font-size:15px; margin:0;">
        Your holiday escape <strong>"{{ $bookable->name }}"</strong> is officially confirmed! We are preparing everything for your arrival in {{ $bookable->location }}.
    </p>
@endsection

@section('service_footer')
    {{-- Removed pro tips and other content --}}
@endsection
