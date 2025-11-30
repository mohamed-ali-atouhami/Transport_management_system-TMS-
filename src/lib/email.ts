import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTemporaryPasswordEmail(
  email: string,
  name: string,
  temporaryPassword: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Transport Management System <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Transport Management System - Your Temporary Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to TMS</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #1a1a1a; margin-bottom: 20px;">Welcome to Transport Management System</h1>
              
              <p>Hello ${name},</p>
              
              <p>Your account has been created by an administrator. Please use the temporary password below to sign in for the first time.</p>
              
              <div style="background-color: #ffffff; border: 2px solid #e0e0e0; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #666;">Temporary Password:</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #1a1a1a; font-family: monospace; letter-spacing: 2px;">${temporaryPassword}</p>
              </div>
              
              <p><strong>Important:</strong> You will be required to change this password when you sign in for the first time.</p>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in" 
                   style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Sign In Now
                </a>
              </p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                If you did not expect this email, please contact your administrator.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in sendTemporaryPasswordEmail:", error);
    throw error;
  }
}

