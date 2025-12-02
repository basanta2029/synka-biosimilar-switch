import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API v1 routes
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Synka API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      patients: '/api/v1/patients',
      drugs: '/api/v1/drugs',
      switches: '/api/v1/switches',
      appointments: '/api/v1/appointments',
      followUps: '/api/v1/follow-ups',
      sms: '/api/v1/sms',
      dashboard: '/api/v1/dashboard',
      sync: '/api/v1/sync',
    },
  });
});

// Mount route handlers
app.use('/api/v1/auth', authRoutes);

// Import patient routes
import patientRoutes from './routes/patientRoutes';
app.use('/api/v1/patients', patientRoutes);

// Import drug routes
import drugRoutes from './routes/drugRoutes';
app.use('/api/v1/drugs', drugRoutes);

// Import switch routes
import switchRoutes from './routes/switchRoutes';
app.use('/api/v1/switches', switchRoutes);

// Import admin routes
import adminRoutes from './routes/adminRoutes';
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Synka API server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🏥 Clinic: ${config.clinic.name}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
