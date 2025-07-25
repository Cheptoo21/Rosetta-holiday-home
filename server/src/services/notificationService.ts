// server/src/services/notificationService.ts
import { emailService } from "./emailService";
import { smsService } from "./smsService";

export interface NotificationData {
  // User info
  email: string;
  phone?: string;
  name: string;

  // Notification content
  type:
    | "booking_confirmation"
    | "new_booking_alert"
    | "property_approval"
    | "welcome"
    | "check_in_reminder"
    | "monthly_report";
  data: any;
}

class NotificationService {
  constructor() {}

  async sendBookingConfirmation(data: {
    guestEmail: string;
    guestPhone?: string;
    guestName: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    bookingId: string;
    propertyAddress: string;
    hostName: string;
    hostPhone: string;
    hostEmail: string;
    guestCount: number;
    nights: number;
  }): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Send email notification
      console.log("📧 Sending booking confirmation email...");
      results.email = await emailService.sendBookingConfirmation(
        data.guestEmail,
        {
          guestName: data.guestName,
          propertyTitle: data.propertyTitle,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          totalPrice: data.totalPrice,
          bookingId: data.bookingId,
          propertyAddress: data.propertyAddress,
          hostName: data.hostName,
          hostPhone: data.hostPhone,
          hostEmail: data.hostEmail,
          guestCount: data.guestCount,
          nights: data.nights,
        }
      );

      // Send SMS notification if phone number is provided
      if (data.guestPhone) {
        console.log("📱 Sending booking confirmation SMS...");
        results.sms = await smsService.sendBookingConfirmationSMS(
          data.guestPhone,
          {
            guestName: data.guestName,
            propertyTitle: data.propertyTitle,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            totalPrice: data.totalPrice,
            bookingId: data.bookingId,
            hostName: data.hostName,
            hostPhone: data.hostPhone,
          }
        );
      }

      return results;
    } catch (error) {
      console.error(
        "❌ Error sending booking confirmation notifications:",
        error
      );
      return results;
    }
  }

  async sendNewBookingAlert(data: {
    hostEmail: string;
    hostPhone?: string;
    hostName: string;
    propertyTitle: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    bookingId: string;
  }): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Send email notification
      console.log("📧 Sending new booking alert email...");
      results.email = await emailService.sendNewBookingAlert(data.hostEmail, {
        hostName: data.hostName,
        propertyTitle: data.propertyTitle,
        guestName: data.guestName,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice: data.totalPrice,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        bookingId: data.bookingId,
      });

      // Send SMS notification if phone number is provided
      if (data.hostPhone) {
        console.log("📱 Sending new booking alert SMS...");
        results.sms = await smsService.sendNewBookingAlertSMS(data.hostPhone, {
          hostName: data.hostName,
          propertyTitle: data.propertyTitle,
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          totalPrice: data.totalPrice,
          bookingId: data.bookingId,
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Error sending new booking alert notifications:", error);
      return results;
    }
  }

  async sendPropertyApprovalNotification(data: {
    hostEmail: string;
    hostPhone: string;
    hostName: string;
    propertyTitle: string;
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
    propertyUrl?: string;
  }): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Send email notification
      console.log("📧 Sending property approval email...");
      results.email = await emailService.sendPropertyApprovalNotification(
        data.hostEmail,
        {
          hostName: data.hostName,
          propertyTitle: data.propertyTitle,
          status: data.status,
          rejectionReason: data.rejectionReason,
          propertyUrl: data.propertyUrl,
        }
      );

      // Send SMS notification if phone number is provided
      if (data.hostPhone) {
        console.log("📱 Sending property approval SMS...");
        results.sms = await smsService.sendPropertyApprovalSMS(data.hostPhone, {
          hostName: data.hostName,
          propertyTitle: data.propertyTitle,
          status: data.status,
          rejectionReason: data.rejectionReason,
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Error sending property approval notifications:", error);
      return results;
    }
  }

  async sendWelcomeNotifications(data: {
    email: string;
    phone?: string;
    name: string;
  }): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Send welcome email
      console.log("📧 Sending welcome email...");
      results.email = await emailService.sendWelcomeEmail(
        data.email,
        data.name
      );

      // Send welcome SMS if phone number is provided
      if (data.phone) {
        console.log("📱 Sending welcome SMS...");
        results.sms = await smsService.sendWelcomeSMS(data.phone, data.name);
      }

      return results;
    } catch (error) {
      console.error("❌ Error sending welcome notifications:", error);
      return results;
    }
  }

  async sendCheckInReminder(data: {
    guestEmail: string;
    guestPhone?: string;
    guestName: string;
    propertyTitle: string;
    checkIn: string;
    hostName: string;
    hostPhone: string;
    propertyAddress: string;
  }): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Send email reminder
      console.log("📧 Sending check-in reminder email...");
      results.email = await emailService.sendCheckInReminder(data.guestEmail, {
        guestName: data.guestName,
        propertyTitle: data.propertyTitle,
        checkIn: data.checkIn,
        hostName: data.hostName,
        hostPhone: data.hostPhone,
        propertyAddress: data.propertyAddress,
      });

      // Send SMS reminder if phone number is provided
      if (data.guestPhone) {
        console.log("📱 Sending check-in reminder SMS...");
        results.sms = await smsService.sendCheckInReminderSMS(data.guestPhone, {
          guestName: data.guestName,
          propertyTitle: data.propertyTitle,
          checkIn: data.checkIn,
          hostName: data.hostName,
          hostPhone: data.hostPhone,
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Error sending check-in reminder notifications:", error);
      return results;
    }
  }

  async sendMonthlyReport(data: {
    hostEmail: string;
    hostPhone?: string;
    hostName: string;
    totalBookings: number;
    totalRevenue: number;
    activeProperties: number;
    month: string;
    year: number;
  }): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Send email report
      console.log("📧 Sending monthly report email...");
      results.email = await emailService.sendMonthlyReport(data.hostEmail, {
        hostName: data.hostName,
        totalBookings: data.totalBookings,
        totalRevenue: data.totalRevenue,
        activeProperties: data.activeProperties,
        month: data.month,
        year: data.year,
      });

      // Send SMS report if phone number is provided
      if (data.hostPhone) {
        console.log("📱 Sending monthly report SMS...");
        results.sms = await smsService.sendMonthlyEarningsSMS(data.hostPhone, {
          hostName: data.hostName,
          totalEarnings: data.totalRevenue,
          bookingCount: data.totalBookings,
          month: data.month,
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Error sending monthly report notifications:", error);
      return results;
    }
  }

  // Test both email and SMS
  async testNotifications(
    email: string,
    phone?: string
  ): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    };

    try {
      // Test email
      console.log("📧 Testing email delivery...");
      results.email = await emailService.sendWelcomeEmail(email, "Test User");

      // Test SMS if phone provided
      if (phone) {
        console.log("📱 Testing SMS delivery...");
        results.sms = await smsService.testSMS(phone);
      }

      return results;
    } catch (error) {
      console.error("❌ Error testing notifications:", error);
      return results;
    }
  }

  // Get status of both services
  getServicesStatus(): {
    email: boolean;
    sms: { provider: string; configured: boolean };
  } {
    return {
      email: true, // Email service is always available if configured
      sms: smsService.getProviderStatus(),
    };
  }
}

export const notificationService = new NotificationService();
