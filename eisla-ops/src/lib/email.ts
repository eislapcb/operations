import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Eisla Ops <ops@eisla.io>";

export async function sendInviteEmail(
  to: string,
  name: string,
  passphrase: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to Eisla Ops Hub",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>You've been invited to Eisla Ops Hub.</p>
      <p>Your temporary passphrase is:</p>
      <p style="font-family: monospace; font-size: 18px; padding: 12px; background: #E8F0F0; border-radius: 4px;">
        <strong>${passphrase}</strong>
      </p>
      <p>You'll be required to set a new password on first login.</p>
      <p>Login at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a></p>
    `,
  });
}

export async function sendQuoteEmail(
  to: string,
  customerName: string,
  orderNumber: string,
  quoteRef: string,
  fee: number,
  description: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Quote ${quoteRef} — Eisla PCB Design`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <div style="background: #0E3D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Eisla PCB Design</h1>
          <p style="margin: 4px 0 0; opacity: 0.8;">Quote ${quoteRef}</p>
        </div>
        <div style="padding: 20px; border: 1px solid #E8F0F0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear ${customerName},</p>
          <p>Please find your quote for order <strong>${orderNumber}</strong>:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #E8F0F0;">
              <td style="padding: 8px;">PCB Design Service</td>
              <td style="padding: 8px; text-align: right;"><strong>£${(fee / 100).toFixed(2)}</strong></td>
            </tr>
          </table>
          <p><strong>Project:</strong> ${description || "—"}</p>
          <p style="color: #666; font-size: 12px;">
            This quote is valid for 30 days. Terms and conditions apply.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendStageNotification(
  to: string,
  orderNumber: string,
  newStage: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Order ${orderNumber} — Stage Update`,
    html: `
      <p>Order <strong>${orderNumber}</strong> has moved to stage: <strong>${newStage}</strong></p>
    `,
  });
}
