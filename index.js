const express = require("express");
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Basic health check route
app.get("/", (req, res) => {
  res.json({
    message: "Homeland Booking API is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

// Test route for SMS functionality
app.post("/send-sms", (req, res) => {
  // TODO: Add your Africastalking or Twilio SMS logic here
  const { phone, message } = req.body;

  console.log(`SMS request: ${phone} - ${message}`);

  res.json({
    status: "success",
    message: "SMS functionality ready",
    phone: phone,
    timestamp: new Date().toISOString(),
  });
});

// API routes for booking system
app.get("/api/bookings", (req, res) => {
  res.json({ message: "Bookings endpoint ready" });
});

app.post("/api/bookings", (req, res) => {
  res.json({ message: "Create booking endpoint ready" });
});

// Use Railway's PORT environment variable
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Homeland Booking server running on port ${PORT}`);
  console.log(`📱 SMS services (Africastalking & Twilio) ready`);
});
