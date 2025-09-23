export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Lightweight helper to send emails via Resend HTTP API to avoid extra deps
 * Requires RESEND_API_KEY in environment variables
 */
export async function sendEmailViaResend({
  to,
  subject,
  html,
  from,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY env var" };
  }

  const payload = {
    from: from || "",
    to: [to],
    subject,
    html,
  } as const;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Resend error ${res.status}: ${errText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
