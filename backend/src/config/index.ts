import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    useWhatsApp: process.env.TWILIO_USE_WHATSAPP === 'true',
    whatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
  },

  // Phone number formatting
  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '+1',

  // Clinic
  clinic: {
    name: process.env.CLINIC_NAME || 'Community Health Clinic',
    phone: process.env.CLINIC_PHONE || '+1234567890',
  },
};
