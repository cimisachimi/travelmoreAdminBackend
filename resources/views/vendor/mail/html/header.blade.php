@props(['url'])
<tr>
<td class="header" style="padding: 40px 0; text-align: center;">
<a href="{{ $url }}" style="display: inline-block;">
    @if (file_exists(public_path('images/logo.png')))
        {{-- Increased width to 250 for a bigger logo --}}
        <img src="{{ config('app.url') }}/images/logo.png"
             width="250"
             alt="{{ config('app.name') }}"
             style="display: block; border: 0; width: 250px; height: auto;">
    @else
        <span style="font-size: 24px; font-weight: bold; color: #3d4852;">{{ config('app.name') }}</span>
    @endif
</a>
</td>
</tr>
