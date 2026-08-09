import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Visa Guide <no-reply@visaguide.app>";

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is required to send emails via Resend.");
}

const resend = new Resend(RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tags: string[];
}

async function sendEmail({ to, subject, html, tags }: SendEmailParams): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      tags,
    });

    console.log(
      `[Resend] Email sent to ${to} | subject="${subject}" | tags=${tags.join(",")}`,
      { id: result.id, status: result.status }
    );
  } catch (error) {
    console.error(
      `[Resend] Failed to send email to ${to} | subject="${subject}" | tags=${tags.join(",")}`,
      error
    );
    throw new Error(
      `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function sendBookingRequestToConsultancy(
  consultancyEmail: string,
  aspirantName: string,
  serviceName: string,
  date: string
): Promise<void> {
  const subject = `New booking request for ${serviceName}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;">
      <h1 style="color:#0f172a;">New Booking Request</h1>
      <p>Hello,</p>
      <p>
        You have received a new booking request from <strong>${aspirantName}</strong> for
        the <strong>${serviceName}</strong> service.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Aspirant Name</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${aspirantName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Service</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${serviceName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Requested Date</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${date}</td>
        </tr>
      </table>
      <p>
        Please review the request and update the booking status in the Visa Guide dashboard.
      </p>
      <p style="color:#475569;font-size:14px;">Thank you,<br/>Visa Guide Team</p>
    </div>
  `;

  await sendEmail({
    to: consultancyEmail,
    subject,
    html,
    tags: ["booking-request", "consultancy"],
  });
}

export async function sendBookingConfirmationToAspirant(
  aspirantEmail: string,
  consultancyName: string,
  date: string,
  timeSlot: string
): Promise<void> {
  const subject = `Your booking is confirmed with ${consultancyName}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;">
      <h1 style="color:#0f172a;">Booking Confirmed</h1>
      <p>Hi there,</p>
      <p>
        Your consultation request with <strong>${consultancyName}</strong> has been confirmed.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Consultancy</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${consultancyName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Date</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${date}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Time Slot</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${timeSlot}</td>
        </tr>
      </table>
      <p>
        If you need to change the appointment or have questions, please contact the consultancy directly.
      </p>
      <p style="color:#475569;font-size:14px;">Best regards,<br/>Visa Guide Team</p>
    </div>
  `;

  await sendEmail({
    to: aspirantEmail,
    subject,
    html,
    tags: ["booking-confirmation", "aspirant"],
  });
}

export async function sendBookingUpdateToAspirant(
  aspirantEmail: string,
  consultancyName: string,
  status: string,
  notes: string
): Promise<void> {
  const subject = `Booking update from ${consultancyName}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;">
      <h1 style="color:#0f172a;">Booking Update</h1>
      <p>Hello,</p>
      <p>
        Your booking with <strong>${consultancyName}</strong> has an update.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Consultancy</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${consultancyName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Status</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${status}</td>
        </tr>
      </table>
      <p><strong>Notes from the consultancy:</strong></p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;white-space:pre-wrap;">${notes}</div>
      <p style="margin-top:16px;">
        If you have any questions, please reply to this message or reach out to ${consultancyName}.
      </p>
      <p style="color:#475569;font-size:14px;">Thanks for using Visa Guide.</p>
    </div>
  `;

  await sendEmail({
    to: aspirantEmail,
    subject,
    html,
    tags: ["booking-update", "aspirant"],
  });
}
