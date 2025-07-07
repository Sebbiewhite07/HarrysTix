import nodemailer from 'nodemailer';
import type { Ticket, Event, UserProfile } from '@shared/schema';

// Email configuration
const createTransporter = () => {
  // For development, use console logging instead of actual email sending
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
  
  // Production email configuration (requires SMTP settings)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendTicketConfirmationEmail = async (
  user: UserProfile,
  ticket: Ticket,
  event: Event
) => {
  try {
    const transporter = createTransporter();
    
    const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const eventTime = event.time || 'Time TBA';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Harry's Tix Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9333ea, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea; }
          .confirmation-code { font-size: 24px; font-weight: bold; color: #9333ea; text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          .highlight { color: #9333ea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Your Ticket is Confirmed!</h1>
            <p>Thank you for your purchase from Harry's Tix</p>
          </div>
          
          <div class="content">
            <h2>Event Details</h2>
            <div class="ticket-details">
              <h3 class="highlight">${event.title}</h3>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${eventTime}</p>
              <p><strong>Venue:</strong> ${event.venue}</p>
              <p><strong>Quantity:</strong> ${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''}</p>
              <p><strong>Total Paid:</strong> £${ticket.totalPrice}</p>
            </div>
            
            <h2>Your Confirmation Code</h2>
            <div class="confirmation-code">
              ${ticket.confirmationCode}
            </div>
            <p style="text-align: center; color: #666;">Please save this confirmation code - you'll need it for entry</p>
            
            <h2>Important Information</h2>
            <ul>
              <li>Arrive at least 15 minutes before the event starts</li>
              <li>Bring this confirmation code (screenshot or printed)</li>
              <li>Valid ID may be required for entry</li>
              <li>Tickets are non-refundable unless the event is cancelled</li>
            </ul>
            
            <div class="footer">
              <p>Questions? Contact us at support@harrystix.com</p>
              <p>Harry's Tix - Premium Student Events in London</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
🎫 YOUR HARRY'S TIX TICKET CONFIRMED

Event: ${event.title}
Date: ${eventDate}
Time: ${eventTime}
Venue: ${event.venue}
Quantity: ${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''}
Total Paid: £${ticket.totalPrice}

CONFIRMATION CODE: ${ticket.confirmationCode}

Please save this confirmation code - you'll need it for entry.

Important Information:
- Arrive at least 15 minutes before the event starts
- Bring this confirmation code (screenshot or printed)
- Valid ID may be required for entry
- Tickets are non-refundable unless the event is cancelled

Questions? Contact us at support@harrystix.com
Harry's Tix - Premium Student Events in London
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Harry\'s Tix <noreply@harrystix.com>',
      to: user.email,
      subject: `🎫 Your ticket for ${event.title} - Confirmation ${ticket.confirmationCode}`,
      text: textContent,
      html: htmlContent
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent to:', user.email);
      console.log('Subject:', mailOptions.subject);
      console.log('Confirmation Code:', ticket.confirmationCode);
      return { success: true, messageId: 'dev-mode' };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Ticket email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending ticket email:', error);
    return { success: false, error: error.message };
  }
};

export const sendPreOrderConfirmationEmail = async (
  user: UserProfile,
  event: Event,
  preOrderId: string
) => {
  try {
    const transporter = createTransporter();
    
    const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pre-Order Confirmation - Harry's Tix</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9333ea, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { color: #9333ea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Pre-Order Confirmed!</h1>
            <p>Your exclusive pre-order has been placed</p>
          </div>
          
          <div class="content">
            <h2>Pre-Order Details</h2>
            <p><strong>Event:</strong> <span class="highlight">${event.title}</span></p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            
            <h2>What happens next?</h2>
            <p>Your pre-order will be reviewed by our team. If approved, we'll charge your saved payment method and send you your ticket with confirmation details.</p>
            
            <p><strong>Review happens:</strong> Tuesday at 7PM each week</p>
            <p><strong>Pre-Order ID:</strong> ${preOrderId}</p>
            
            <p>You'll receive another email once your ticket is confirmed and ready!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Harry\'s Tix <noreply@harrystix.com>',
      to: user.email,
      subject: `🎯 Pre-order confirmed for ${event.title}`,
      html: htmlContent
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Pre-order email would be sent to:', user.email);
      console.log('Subject:', mailOptions.subject);
      return { success: true, messageId: 'dev-mode' };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Pre-order email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending pre-order email:', error);
    return { success: false, error: error.message };
  }
};