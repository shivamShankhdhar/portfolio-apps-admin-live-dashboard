import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: gmailUser || '',
    pass: gmailPass || '',
  },
});

export async function sendOTPEmail(email: string, otp: string, name?: string) {
  if (!gmailUser || !gmailPass) {
    console.log(`[Email] SMTP not configured. OTP for ${email}: ${otp}`);
    return { success: false, reason: 'SMTP not configured' };
  }

  try {
    const mailOptions = {
      from: `"Shivam Admin Center" <${gmailUser}>`,
      to: email,
      subject: `🔑 Your Admin Access OTP: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0c0d14; border-radius: 16px; border: 1px solid #25273b; overflow: hidden; color: #ffffff;">
          <div style="height: 4px; background: linear-gradient(90deg, #ef4444 0%, #f43f5e 50%, #dc2626 100%);"></div>
          
          <div style="padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(12, 13, 20, 0) 100%); text-align: center;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #ffffff; font-weight: 800; font-size: 18px; margin-bottom: 12px;">
              SS
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
              Admin Control Center
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #f87171;">
              One-Time Password Verification
            </p>
          </div>

          <div style="padding: 0 32px 32px 32px;">
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
              Hello ${name || 'Admin'}, your one-time verification passcode for logging into the Admin Dashboard is:
            </p>

            <div style="background-color: #161726; border: 2px dashed rgba(239, 68, 68, 0.4); border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);">
                ${otp}
              </span>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #f87171; font-weight: 600;">
                Valid for 15 minutes
              </p>
            </div>

            <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
              If you did not request this OTP, please ignore this email or review your security configuration.
            </p>
          </div>

          <div style="padding: 16px 32px; border-top: 1px solid #1f2030; text-align: center; font-size: 11px; color: #475569;">
            Unified Admin Control Hub &bull; Shivam Shankhdhar
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] OTP sent successfully to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
}
