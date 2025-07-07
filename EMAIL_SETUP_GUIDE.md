# Email Setup Guide for Harry's Tix

## Current Status
- ✅ Email system is implemented and working
- ✅ Development mode shows email content in console logs
- ⚠️ Production emails require SMTP configuration

## Development Mode (Current)
In development, emails are logged to the console instead of being sent. You'll see messages like:
```
📧 Email would be sent to: user@example.com
Subject: 🎫 Your ticket for Event Name - Confirmation HTX-ABC123
Confirmation Code: HTX-ABC123
```

## Production Email Setup Options

### Option 1: Gmail SMTP (Recommended for testing)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → App passwords
   - Generate a new app password
3. Add these environment variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Harry's Tix <your-email@gmail.com>
   ```

### Option 2: SendGrid (Recommended for production)
1. Sign up for SendGrid account
2. Create an API key
3. Add these environment variables:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=Harry's Tix <noreply@yourdomain.com>
   ```

### Option 3: Mailgun
1. Sign up for Mailgun account
2. Get your SMTP credentials
3. Add these environment variables:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-username
   SMTP_PASS=your-mailgun-password
   SMTP_FROM=Harry's Tix <noreply@yourdomain.com>
   ```

## How to Add Environment Variables in Replit
1. Go to your Replit project
2. Click on "Secrets" (lock icon) in the left sidebar
3. Add each environment variable:
   - Key: `SMTP_HOST`
   - Value: `smtp.gmail.com`
   - (repeat for each variable)

## Testing Email Functionality
Once SMTP is configured:
1. Set `NODE_ENV=production` in your environment
2. Place a test pre-order or purchase a ticket
3. Check the console logs for email success/error messages
4. Check the recipient's email inbox

## Email Templates Included
- **Pre-order Confirmation**: Sent when users place pre-orders
- **Ticket Confirmation**: Sent when payments are confirmed
- **Professional HTML Design**: Includes event details, confirmation codes, and branding

## Troubleshooting
- Check console logs for specific error messages
- Verify all SMTP environment variables are set correctly
- Test with Gmail first (easiest setup)
- Make sure less secure app access is enabled (if using Gmail without app password)