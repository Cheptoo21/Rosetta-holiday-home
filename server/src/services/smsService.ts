// server/src/services/smsService.ts
import AfricasTalking from "africastalking";
import { Twilio } from "twilio";

export interface SMSTemplate {
  to: string;
  message: string;
}

export interface BookingConfirmationSMS {
  guestName: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  bookingId: string;
  hostName: string;
  hostPhone: string;
}

export interface NewBookingAlertSMS {
  hostName: string;
  propertyTitle: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  bookingId: string;
}

export interface PropertyApprovalSMS {
  hostName: string;
  propertyTitle: string;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

class SMSService {
  private africasTalking: any;
  private twilio: Twilio | null = null;
  private smsProvider: "africastalking" | "twilio" | "both";

  constructor() {
    this.smsProvider = (process.env.SMS_PROVIDER as any) || "africastalking";
    this.setupProviders();
  }

  private setupProviders() {
    // Setup Africa's Talking (for Kenya)
    if (this.smsProvider === "africastalking" || this.smsProvider === "both") {
      this.africasTalking = AfricasTalking({
        apiKey: process.env.AFRICAS_TALKING_API_KEY || "your-api-key",
        username: process.env.AFRICAS_TALKING_USERNAME || "your-username",
      });
    }

    // Setup Twilio (for international)
    if (this.smsProvider === "twilio" || this.smsProvider === "both") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (accountSid && authToken) {
        this.twilio = new Twilio(accountSid, authToken);
      }
    }
  }

  private isKenyanNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // Check if it's a Kenyan number (starts with 254 or local format)
    return (
      cleanNumber.startsWith("254") ||
      cleanNumber.startsWith("0") ||
      cleanNumber.length === 9
    );
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, "");

    // If it starts with 0, replace with 254
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "254" + cleanNumber.substring(1);
    }

    // If it's 9 digits, add 254
    if (cleanNumber.length === 9) {
      cleanNumber = "254" + cleanNumber;
    }

    // Add + prefix
    return "+" + cleanNumber;
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const isKenyan = this.isKenyanNumber(phoneNumber);

      console.log(`📱 Sending SMS to ${formattedNumber}...`);

      // Choose provider based on number location
      if (isKenyan && this.africasTalking) {
        return await this.sendViaAfricasTalking(formattedNumber, message);
      } else if (this.twilio) {
        return await this.sendViaTwilio(formattedNumber, message);
      } else {
        console.error("❌ No SMS provider configured");
        return false;
      }
    } catch (error) {
      console.error("❌ SMS sending failed:", error);
      return false;
    }
  }

  private async sendViaAfricasTalking(
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    try {
      const sms = this.africasTalking.SMS;

      const options = {
        to: phoneNumber,
        message: message,
        from: process.env.AFRICAS_TALKING_SENDER_ID || "Homeland", // Max 11 characters
      };

      const result = await sms.send(options);

      if (result.SMSMessageData.Recipients.length > 0) {
        const recipient = result.SMSMessageData.Recipients[0];
        if (recipient.status === "Success") {
          console.log(
            `✅ SMS sent successfully via Africa's Talking to ${phoneNumber}`
          );
          return true;
        } else {
          console.error(`❌ SMS failed via Africa's Talking:`, recipient);
          return false;
        }
      } else {
        console.error("❌ No recipients in SMS response");
        return false;
      }
    } catch (error) {
      console.error("❌ Africa's Talking SMS error:", error);
      return false;
    }
  }

  private async sendViaTwilio(
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    try {
      if (!this.twilio) {
        console.error("❌ Twilio not configured");
        return false;
      }

      const result = await this.twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
        to: phoneNumber,
      });

      console.log(`✅ SMS sent successfully via Twilio to ${phoneNumber}`);
      console.log(`📱 Message SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error("❌ Twilio SMS error:", error);
      return false;
    }
  }

  // Specific SMS methods with templates
  async sendBookingConfirmationSMS(
    phoneNumber: string,
    data: BookingConfirmationSMS
  ): Promise<boolean> {
    const message = `🎉 BOOKING CONFIRMED!

Property: ${data.propertyTitle}
Dates: ${data.checkIn} - ${data.checkOut}
Total: $${data.totalPrice}
Guest: ${data.guestName}
Booking ID: ${data.bookingId}

Host Contact:
${data.hostName}
${data.hostPhone}

Welcome to Homelandbooking.com!`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendNewBookingAlertSMS(
    phoneNumber: string,
    data: NewBookingAlertSMS
  ): Promise<boolean> {
    const message = `🔔 NEW BOOKING ALERT!

Property: ${data.propertyTitle}
Guest: ${data.guestName}
Dates: ${data.checkIn} - ${data.checkOut}
Earnings: $${data.totalPrice}
Booking ID: ${data.bookingId}

Guest Contact: ${data.guestPhone}

Contact your guest within 24hrs!
- Homelandbooking.com`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendPropertyApprovalSMS(
    phoneNumber: string,
    data: PropertyApprovalSMS
  ): Promise<boolean> {
    let message: string;

    if (data.status === "APPROVED") {
      message = `✅ PROPERTY APPROVED!

"${data.propertyTitle}" is now LIVE on Homelandbooking.com!

Your property is visible to guests and ready for bookings. Start earning today!

- Homelandbooking.com`;
    } else {
      message = `❌ PROPERTY NEEDS UPDATES

"${data.propertyTitle}" requires attention before approval.

${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ""}

Please update your listing and resubmit.
- Homelandbooking.com`;
    }

    return await this.sendSMS(phoneNumber, message);
  }

  async sendWelcomeSMS(
    phoneNumber: string,
    hostName: string
  ): Promise<boolean> {
    const message = `🏠 Welcome to Homelandbooking.com!

Hi ${hostName}! 

Your host account is ready. Start listing your properties and earning income today!

List your first property:
${process.env.CLIENT_URL}/create-property

- Homelandbooking.com Team`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendCheckInReminderSMS(
    phoneNumber: string,
    data: {
      guestName: string;
      propertyTitle: string;
      checkIn: string;
      hostName: string;
      hostPhone: string;
    }
  ): Promise<boolean> {
    const message = `🏠 CHECK-IN REMINDER

Hi ${data.guestName}!

Tomorrow: ${data.checkIn}
Property: ${data.propertyTitle}

Contact your host:
${data.hostName}
${data.hostPhone}

Have a great stay!
- Homelandbooking.com`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendMonthlyEarningsSMS(
    phoneNumber: string,
    data: {
      hostName: string;
      totalEarnings: number;
      bookingCount: number;
      month: string;
    }
  ): Promise<boolean> {
    const message = `📊 MONTHLY EARNINGS REPORT

Hi ${data.hostName}!

${data.month} Summary:
💰 Earned: $${data.totalEarnings}
📅 Bookings: ${data.bookingCount}

Keep up the great work!
- Homelandbooking.com`;

    return await this.sendSMS(phoneNumber, message);
  }

  // Test SMS connectivity
  async testSMS(phoneNumber: string): Promise<boolean> {
    const testMessage = `🧪 Test SMS from Homelandbooking.com

This is a test message to verify SMS delivery is working correctly.

If you receive this, your SMS system is configured properly!

- Homelandbooking.com Team`;

    return await this.sendSMS(phoneNumber, testMessage);
  }

  // Get provider status
  getProviderStatus(): { provider: string; configured: boolean } {
    let configured = false;

    if (this.smsProvider === "africastalking" || this.smsProvider === "both") {
      configured = !!(
        process.env.AFRICAS_TALKING_API_KEY &&
        process.env.AFRICAS_TALKING_USERNAME
      );
    }

    if (this.smsProvider === "twilio" || this.smsProvider === "both") {
      configured =
        configured ||
        !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    }

    return {
      provider: this.smsProvider,
      configured,
    };
  }
}

export const smsService = new SMSService();
