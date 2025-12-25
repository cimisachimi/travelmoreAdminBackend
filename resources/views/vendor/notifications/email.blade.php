
{{-- ================= GREETING ================= --}}
@if (! empty($greeting))
# {{ $greeting }}
@else
@if ($level === 'error')
# @lang('Whoops!')
@else
# @lang('Hello!')
@endif
@endif

{{-- ================= INTRO LINES ================= --}}
@foreach ($introLines as $line)
{{ $line }}

@endforeach

{{-- ================= ACTION BUTTON ================= --}}
@isset($actionText)
@php
    $color = match ($level) {
        'success', 'error' => $level,
        default => 'primary',
    };
@endphp

<x-mail::button :url="$actionUrl" :color="$color">
{{ $actionText }}
</x-mail::button>
@endisset

{{-- ================= OUTRO LINES ================= --}}
@foreach ($outroLines as $line)
{{ $line }}

@endforeach

{{-- ================= SALUTATION ================= --}}
@if (! empty($salutation))
{{ $salutation }}
@else
@lang('Regards,')<br>
{{ config('app.name') }}
@endif

{{-- ================= SUBCOPY ================= --}}
@isset($actionText)
<x-slot:subcopy>
@lang(
    "If you're having trouble clicking the \":actionText\" button, copy and paste the URL below\n".
    'into your web browser:',
    ['actionText' => $actionText]
)
<br>
<a href="{{ $actionUrl }}">{{ $displayableActionUrl }}</a>
</x-slot:subcopy>
@endisset

</x-mail::message>
