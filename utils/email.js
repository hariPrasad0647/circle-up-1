const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const buildOtpEmail = (code, minutes) => {
  const digits = code.toString().split('').join('</td><td style="width:44px;height:52px;text-align:center;vertical-align:middle;font-size:28px;font-weight:700;color:#1a1a1a;background:#f4f4f5;border-radius:8px;">');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Verify your email – CircleUp</title>
</head>
<body style="margin:0;padding:0;background:#f9f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f9f9fb;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="520" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background:#000000;padding:28px 40px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Circle<span style="color:#a3e635;">Up</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;">
                Verify your email address
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
                Use the code below to complete your CircleUp sign‑up.
                It will expire in <strong>${minutes} minute${minutes !== 1 ? 's' : ''}</strong>.
              </p>

              <!-- OTP digits -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 32px;">
                <tr>
                  <td style="width:44px;height:52px;text-align:center;vertical-align:middle;font-size:28px;font-weight:700;color:#1a1a1a;background:#f4f4f5;border-radius:8px;">${digits}</td>
                </tr>
              </table>

              <!-- Warning -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#fff7ed;border-left:4px solid #f97316;border-radius:4px;margin-bottom:32px;width:100%;">
                <tr>
                  <td style="padding:12px 16px;font-size:13px;color:#92400e;line-height:1.5;">
                    <strong>Never share this code.</strong> CircleUp will never ask for it via phone or chat.
                    If you didn't request this, you can safely ignore this email.
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                Having trouble? Reply to this email and we'll help you out.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} CircleUp. All rights reserved.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">
                You're receiving this because you signed up at CircleUp.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendOtpEmail = async (to, code) => {
  const minutes = Math.floor(Number(process.env.OTP_EXPIRES_IN || 300) / 60);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your CircleUp verification code',
    html: buildOtpEmail(code, minutes),
  });
};

module.exports = { sendOtpEmail };
