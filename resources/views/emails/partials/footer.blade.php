{{-- FOOTER SECTION --}}
<tr>
    <td style="padding: 30px 20px; background-color: #f1f5f9; text-align: center;">

        {{-- Brand / Website --}}
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">
            Travelmore.travel
        </p>

        {{-- Contact Info --}}
        <p style="margin: 10px 0; font-size: 12px; color: #64748b; line-height: 1.6;">
            Your partner for seamless travel experiences.<br>
            Got questions? Contact us at
            <a href="mailto:support@travelmore.travel" style="color: #2563eb; text-decoration: none;">support@travelmore.travel</a>
            or via WhatsApp.
        </p>

        {{-- Social/Quick Links --}}
        <p style="margin: 15px 0; font-size: 11px; color: #94a3b8;">
            <a href="https://travelmore.travel/terms" style="color: #94a3b8; text-decoration: underline;">Terms of Service</a>
            &nbsp; | &nbsp;
            <a href="https://travelmore.travel/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a>
        </p>

        {{-- Legal Disclaimer --}}
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 10px; color: #94a3b8; line-height: 1.4;">
                © {{ date('Y') }} Travelmore. All rights reserved.<br>
                This is an automated booking confirmation. Please do not reply directly to this email.
                If you have an issue with your order #{{ $order->order_number }}, please contact our support team.
            </p>
        </div>

    </td>
</tr>
