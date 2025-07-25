// server/src/services/emailService.ts
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.setupTransporter();
    this.setupHandlebarsHelpers();
  }

  private setupTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private setupHandlebarsHelpers() {
    // Format currency helper
    handlebars.registerHelper("currency", (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    });

    // Format date helper
    handlebars.registerHelper("formatDate", (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(date));
    });

    // Format datetime helper
    handlebars.registerHelper("formatDateTime", (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    });

    // Conditional helper
    handlebars.registerHelper("if_eq", function (a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "emails",
        `${options.template}.hbs`
      );
      const templateContent = fs.readFileSync(templatePath, "utf8");
      const template = handlebars.compile(templateContent);
      const html = template(options.context);

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@homelandbooking.com",
        to: options.to,
        subject: options.subject,
        html: html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      throw error;
    }
  }

  // Welcome email for new hosts
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "🏠 Welcome to Homelandbooking.com!",
      template: "welcome-host",
      context: {
        firstName,
        email,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        dashboardUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/host-dashboard`,
        supportUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/support`,
      },
    });
  }

  // Booking confirmation email to guests
  async sendBookingConfirmation(
    email: string,
    guestName: string,
    bookingDetails: {
      id: string;
      property: any;
      checkIn: Date;
      checkOut: Date;
      guests: number;
      totalPrice: number;
      host: any;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "🎉 Booking Confirmed - Homelandbooking.com",
      template: "booking-confirmation",
      context: {
        guestName,
        email,
        booking: bookingDetails,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        supportUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/support`,
      },
    });
  }

  // New booking alert to hosts
  async sendNewBookingAlert(
    email: string,
    hostName: string,
    bookingDetails: {
      id: string;
      property: any;
      checkIn: Date;
      checkOut: Date;
      guests: number;
      totalPrice: number;
      guest: any;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "🔔 New Booking Alert - Homelandbooking.com",
      template: "new-booking-alert",
      context: {
        hostName,
        email,
        booking: bookingDetails,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        dashboardUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/host-dashboard`,
      },
    });
  }

  // Property approval notification
  async sendPropertyApprovalNotification(
    email: string,
    hostName: string,
    propertyDetails: {
      id: string;
      title: string;
      approvalStatus: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject:
        propertyDetails.approvalStatus === "APPROVED"
          ? "✅ Property Approved - Homelandbooking.com"
          : "❌ Property Rejected - Homelandbooking.com",
      template: "property-approval",
      context: {
        hostName,
        email,
        property: propertyDetails,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        dashboardUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/host-dashboard`,
      },
    });
  }

  // Password reset email
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: email,
      subject: "🔐 Reset Your Password - Homelandbooking.com",
      template: "password-reset",
      context: {
        firstName,
        email,
        resetUrl,
        resetToken,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        supportUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/support`,
      },
    });
  }

  // Password reset confirmation
  async sendPasswordResetConfirmation(
    email: string,
    firstName: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "✅ Password Reset Successful - Homelandbooking.com",
      template: "password-reset-confirmation",
      context: {
        firstName,
        email,
        loginUrl: `${process.env.CLIENT_URL || "http://localhost:3000"}/login`,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        supportUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/support`,
      },
    });
  }

  // Password change confirmation (for authenticated users)
  async sendPasswordChangeConfirmation(
    email: string,
    firstName: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "🔐 Password Changed - Homelandbooking.com",
      template: "password-change-confirmation",
      context: {
        firstName,
        email,
        changeDate: new Date().toLocaleDateString(),
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        supportUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/support`,
      },
    });
  }

  // Check-in reminder email
  async sendCheckInReminder(
    email: string,
    guestName: string,
    bookingDetails: {
      id: string;
      property: any;
      checkIn: Date;
      host: any;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "📅 Check-in Reminder - Homelandbooking.com",
      template: "check-in-reminder",
      context: {
        guestName,
        email,
        booking: bookingDetails,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        supportUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/support`,
      },
    });
  }

  // Monthly host report
  async sendMonthlyHostReport(
    email: string,
    hostName: string,
    reportData: {
      month: string;
      year: number;
      totalBookings: number;
      totalRevenue: number;
      occupancyRate: number;
      topPerformingProperty?: any;
      bookings: any[];
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `📊 Monthly Report - ${reportData.month} ${reportData.year} - Homelandbooking.com`,
      template: "monthly-report",
      context: {
        hostName,
        email,
        report: reportData,
        clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
        dashboardUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/host-dashboard`,
      },
    });
  }

  // Test email functionality
  async sendTestEmail(email: string, type: string): Promise<void> {
    switch (type) {
      case "welcome":
        await this.sendWelcomeEmail(email, "Test User");
        break;
      case "booking":
        await this.sendBookingConfirmation(email, "Test Guest", {
          id: "TEST123",
          property: { title: "Test Property", city: "Test City" },
          checkIn: new Date(Date.now() + 86400000),
          checkOut: new Date(Date.now() + 172800000),
          guests: 2,
          totalPrice: 200,
          host: { firstName: "Test", lastName: "Host", phone: "+1234567890" },
        });
        break;
      case "approval":
        await this.sendPropertyApprovalNotification(email, "Test Host", {
          id: "TEST123",
          title: "Test Property",
          approvalStatus: "APPROVED",
        });
        break;
      case "reset":
        await this.sendPasswordResetEmail(email, "Test User", "test-token-123");
        break;
      default:
        throw new Error("Unknown email type");
    }
  }
}

export const emailService = new EmailService();
export default emailService;
