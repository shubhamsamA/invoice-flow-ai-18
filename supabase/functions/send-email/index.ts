const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const { type, to, data } = await req.json();

    if (!type || !to) {
      return new Response(JSON.stringify({ error: 'Missing type or to' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = generateEmail(type, data);

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'FLOW Invoice <onboarding@resend.dev>',
        to: [to],
        subject: email.subject,
        html: email.html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Email send error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateEmail(type: string, data: Record<string, any> = {}): { subject: string; html: string } {
  const brandColor = '#9AB17A';
  const bgColor = '#f9f7f0';
  const textColor = '#2d3b1e';

  const wrapper = (title: string, content: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:${bgColor};font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:${brandColor};padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">FLOW.</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="margin:0 0 16px;color:${textColor};font-size:22px;font-weight:600;">${title}</h2>
          ${content}
        </div>
        <div style="padding:24px 40px;background:#f5f3eb;text-align:center;">
          <p style="margin:0;color:#888;font-size:12px;">© ${new Date().getFullYear()} FLOW Invoice. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to FLOW! 🎉',
        html: wrapper('Welcome aboard!', `
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi${data.name ? ` ${data.name}` : ''},</p>
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 20px;">
            Thanks for joining <strong>FLOW</strong> — your professional invoice design workspace. You're all set to create stunning invoices, manage clients, and streamline your billing.</p>
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 24px;">Here's what you can do:</p>
          <ul style="color:${textColor};font-size:15px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
            <li>⚡ Create invoices with AI assistance</li>
            <li>🎨 Customize your brand & templates</li>
            <li>📦 Manage inventory & clients</li>
            <li>🧾 Generate GST-ready bills</li>
          </ul>
          <a href="${data.loginUrl || '#'}" style="display:inline-block;background:${brandColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Go to Dashboard →
          </a>
        `),
      };

    case 'password_reset':
      return {
        subject: 'Reset Your FLOW Password',
        html: wrapper('Password Reset Request', `
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 20px;">
            We received a request to reset the password for your account.</p>
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 24px;">
            Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${data.resetUrl || '#'}" style="display:inline-block;background:${brandColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Reset Password
          </a>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:20px 0 0;">
            If you didn't request this, you can safely ignore this email.</p>
        `),
      };

    case 'email_verification':
      return {
        subject: 'Verify Your Email — FLOW',
        html: wrapper('Verify Your Email', `
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi${data.name ? ` ${data.name}` : ''},</p>
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 24px;">
            Please confirm your email address by clicking the button below:</p>
          <a href="${data.verificationUrl || '#'}" style="display:inline-block;background:${brandColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Verify Email Address
          </a>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:20px 0 0;">
            If you didn't create an account, please ignore this email.</p>
        `),
      };

    case 'login_notification':
      return {
        subject: 'New Login to Your FLOW Account',
        html: wrapper('New Login Detected', `
          <p style="color:${textColor};font-size:15px;line-height:1.6;margin:0 0 20px;">
            A new login to your FLOW account was detected.</p>
          <div style="background:#f5f3eb;padding:16px 20px;border-radius:8px;margin:0 0 20px;">
            <p style="margin:0;color:${textColor};font-size:14px;"><strong>Time:</strong> ${data.loginTime || new Date().toLocaleString()}</p>
          </div>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
            If this wasn't you, please reset your password immediately.</p>
        `),
      };

    default:
      return {
        subject: 'Notification from FLOW',
        html: wrapper('Notification', `
          <p style="color:${textColor};font-size:15px;line-height:1.6;">${data.message || 'You have a new notification from FLOW.'}</p>
        `),
      };
  }
}
