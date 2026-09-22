import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASSWORD;

/** The canonical super-admin address that always gets detailed security emails */
const SUPER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 's.shankhdhar1981@gmail.com').trim().toLowerCase();

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

export interface LoginAlertDetails {
  email: string;
  timestamp: Date;
  ip: string;
  device: string;
  location: string;
}

/**
 * Send login alerts:
 * - Super admin always gets a detailed security report (even if they are the one logging in)
 * - If the logging user differs from the super admin, they also get a brief confirmation note
 */
export async function sendLoginAlertEmail(details: LoginAlertDetails) {
  const { email, timestamp, ip, device, location } = details;

  if (!gmailUser || !gmailPass) {
    console.log(
      `[Email] SMTP not configured. Login by ${email} at ${timestamp.toISOString()} (IP: ${ip}, Device: ${device}, Location: ${location})`
    );
    return { success: false, reason: 'SMTP not configured' };
  }

  const formattedDate = timestamp.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Kolkata',
  });

  const loginEmail = email.trim().toLowerCase();
  const isSuperAdmin = loginEmail === SUPER_ADMIN_EMAIL;

  const promises: Promise<any>[] = [];

  // ─── 1. Detailed email → Super Admin ────────────────────────────────────
  const detailedHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0c0d14; border-radius: 16px; border: 1px solid #25273b; overflow: hidden; color: #ffffff;">
      <div style="height: 4px; background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #dc2626 100%);"></div>

      <div style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.14) 0%, rgba(12, 13, 20, 0) 100%); text-align: center;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); font-size: 22px; margin-bottom: 12px;">🛡️</div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
          ${isSuperAdmin ? 'Your Sign-In Detected' : 'Admin Panel Access Alert'}
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #f87171;">
          ${isSuperAdmin ? 'Security notification for your account' : 'Another admin account logged in — review details below'}
        </p>
      </div>

      <div style="padding: 0 32px 28px 32px;">
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          ${isSuperAdmin
            ? `A new administrative session was established for <strong style="color:#fff;">${loginEmail}</strong> (your account).`
            : `An admin account <strong style="color:#fff;">${loginEmail}</strong> just signed in to the Admin Control Center.`
          }
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #141624; border-radius: 12px; overflow: hidden; border: 1px solid #23263d;">
          <tbody>
            <tr style="border-bottom: 1px solid #23263d;">
              <td style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; width: 32%;">Account</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #ffffff; font-family: monospace;">${loginEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #23263d;">
              <td style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;">Date &amp; Time</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #ffffff;">${formattedDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #23263d;">
              <td style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;">IP Address</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #38bdf8; font-family: monospace;">${ip}</td>
            </tr>
            <tr style="border-bottom: 1px solid #23263d;">
              <td style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;">Device &amp; Browser</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #ffffff;">${device}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;">Location</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #34d399;">📍 ${location}</td>
            </tr>
          </tbody>
        </table>

        <div style="background-color: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #fca5a5;">
            <strong>Single Session Policy:</strong> Only one admin session runs at a time. Any prior active session was automatically signed out upon this login.
          </p>
        </div>

        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #64748b;">
          ${isSuperAdmin
            ? 'If this was you, no action is needed. If you did not sign in, change your password immediately from Settings.'
            : 'If you did not authorize this access, sign in and revoke the session from Settings → Security.'
          }
        </p>
      </div>

      <div style="padding: 16px 32px; border-top: 1px solid #1f2030; text-align: center; font-size: 11px; color: #475569;">
        Admin Control Hub &bull; Security Operations &bull; Shivam Shankhdhar
      </div>
    </div>
  `;

  promises.push(
    transporter.sendMail({
      from: `"Admin Hub Security" <${gmailUser}>`,
      to: SUPER_ADMIN_EMAIL,
      subject: isSuperAdmin
        ? `🔐 Your Admin Sign-In — ${formattedDate}`
        : `🚨 Security Alert: ${loginEmail} Signed In`,
      html: detailedHtml,
    }).then(() => {
      console.log(`[Email] Detailed login alert sent to super admin: ${SUPER_ADMIN_EMAIL}`);
    })
  );

  // ─── 2. Brief confirmation → logging user (only if they differ from super admin) ─
  if (!isSuperAdmin) {
    const briefHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #0c0d14; border-radius: 14px; border: 1px solid #25273b; overflow: hidden; color: #ffffff;">
        <div style="height: 3px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);"></div>

        <div style="padding: 24px 28px 20px 28px; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 20px;">✅</p>
          <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">Sign-In Confirmed</h1>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">Admin Control Center</p>
        </div>

        <div style="padding: 0 28px 24px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            Hello, your account <strong style="color:#fff;">${loginEmail}</strong> was just used to sign in.
          </p>

          <table style="width: 100%; border-collapse: collapse; background-color: #141624; border-radius: 10px; overflow: hidden; border: 1px solid #23263d; margin-bottom: 16px;">
            <tbody>
              <tr style="border-bottom: 1px solid #23263d;">
                <td style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 38%;">Time</td>
                <td style="padding: 10px 14px; font-size: 12px; color: #ffffff;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Location</td>
                <td style="padding: 10px 14px; font-size: 12px; color: #34d399;">📍 ${location}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
            If this wasn't you, please contact the super administrator immediately.
          </p>
        </div>

        <div style="padding: 12px 28px; border-top: 1px solid #1f2030; text-align: center; font-size: 11px; color: #475569;">
          Admin Control Hub &bull; Shivam Shankhdhar
        </div>
      </div>
    `;

    promises.push(
      transporter.sendMail({
        from: `"Admin Hub" <${gmailUser}>`,
        to: loginEmail,
        subject: `✅ Sign-In Confirmed — Admin Control Center`,
        html: briefHtml,
      }).then(() => {
        console.log(`[Email] Brief login confirmation sent to: ${loginEmail}`);
      })
    );
  }

  try {
    await Promise.allSettled(promises);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Failed to send login alert emails:', error);
    return { success: false, error: error.message };
  }
}
