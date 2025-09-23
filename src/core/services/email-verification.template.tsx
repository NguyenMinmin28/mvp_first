export function renderVerificationEmail(code: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7fb;padding:40px 0;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="background:#ffffff;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:#111111;color:#ffffff;font-weight:700;font-size:20px;letter-spacing:0.2px;">
              Clevrs Verification
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;line-height:28px;">Verify your email</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#6b7280;">
                Use the following code to complete your sign up. This code will expire in 10 minutes.
              </p>
              <div style="margin:24px 0;">
                <div style="display:inline-block;padding:12px 20px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;font-weight:700;letter-spacing:8px;font-size:22px;color:#111827;">
                  ${code}
                </div>
              </div>
              <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">
                Didn’t request this? You can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} Clevrs. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
