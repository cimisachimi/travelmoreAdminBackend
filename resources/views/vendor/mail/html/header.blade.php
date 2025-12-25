@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (file_exists(public_path('images/logo.png')))
    <img src="{{ $message->embed(public_path('images/logo.png')) }}"
         width="180"
         alt="{{ config('app.name') }}"
         style="display: block; border: 0;">
@else
    {{ config('app.name') }}
@endif
</a>
</td>
</tr>
