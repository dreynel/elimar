import * as brevo from '@getbrevo/brevo';
import { env } from './env.js';

// Initialize Brevo API client
let brevoClient: brevo.TransactionalEmailsApi | null = null;

if (env.BREVO_API_KEY) {
  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);
  brevoClient = apiInstance;
}

// Send email using Brevo API
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  from?: { email: string; name: string };
}): Promise<boolean> => {
  if (!brevoClient) {
    console.error('❌ Brevo API client not initialized - check BREVO_API_KEY in .env');
    return false;
  }

  try {
    console.log(`📨 Sending email via Brevo to ${options.to}...`);
    console.log(`📧 Sender: ${options.from?.email || env.EMAIL_FROM} (${options.from?.name || env.EMAIL_FROM_NAME})`);
    console.log(`📝 Subject: ${options.subject}`);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = options.from || { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME };
    sendSmtpEmail.to = [{ email: options.to }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;

    const result = await brevoClient.sendTransacEmail(sendSmtpEmail) as any;
    console.log(`✅ Email sent successfully via Brevo.`);
    console.log(`📬 Message ID:`, result?.messageId || 'No message ID returned');
    console.log(`📋 Full response:`, JSON.stringify(result, null, 2));
    return true;
  } catch (error: any) {
    console.error('❌ Brevo email error:');
    console.error('Error message:', error?.message || 'Unknown error');
    console.error('Error code:', error?.code);
    console.error('Error body:', error?.body);
    if (error?.response) {
      console.error('❌ Brevo API response:', JSON.stringify(error.response, null, 2));
    }
    if (error?.response?.body) {
      console.error('❌ Response body:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
};

export const verifyEmailConfig = async () => {
  try {
    if (!env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY not configured in .env file');
      return false;
    }

    if (!env.EMAIL_FROM) {
      console.error('❌ EMAIL_FROM not configured in .env file');
      return false;
    }

    if (!brevoClient) {
      console.error('❌ Brevo API client not initialized');
      console.log('\n📧 Email Configuration Issue:');
      console.log('   1. Make sure BREVO_API_KEY is set in your .env file');
      console.log('   2. Get your API key from: https://app.brevo.com/settings/keys/api');
      return false;
    }

    console.log('✅ Email service ready (Brevo API)');
    console.log(`📧 Sender email: ${env.EMAIL_FROM}`);
    console.log(`📧 Sender name: ${env.EMAIL_FROM_NAME}`);
    console.log('\n⚠️  IMPORTANT: Make sure your sender email is verified in Brevo!');
    console.log('   Visit: https://app.brevo.com/settings/senders');
    console.log('   The sender email must match EMAIL_FROM in your .env file\n');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};
