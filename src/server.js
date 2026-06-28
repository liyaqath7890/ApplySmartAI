import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Environment validation — must run before anything else ────────────────────
dotenv.config();
import { validateEnvOrFail } from '../backend/config/envValidator.js';
validateEnvOrFail();

// Import database and models
import sequelize, { testConnection, syncDatabase } from '../backend/config/database.js';
import { sequelize as sequelizeInstance } from '../backend/routes/models/index.js';

// Import routes — existing
import authRoutes from '../backend/routes/authRoutes.js';
import jobRoutes from '../backend/routes/jobRoutes.js';
import aiMatchingRoutes from '../backend/routes/aiMatchingRoutes.js';
import agentRoutes from '../backend/routes/agentRoutes.js';
import embeddingRoutes from '../backend/routes/embeddingRoutes.js';
import interviewRoutes from '../backend/routes/interviewRoutes.js';
import learningRoutes from '../backend/routes/learningRoutes.js';
import roadmapRoutes from '../backend/routes/roadmapRoutes.js';
import portfolioRoutes from '../backend/routes/portfolioRoutes.js';
import notificationRoutes from '../backend/routes/notificationRoutes.js';
import analyticsRoutes from '../backend/routes/analyticsRoutes.js';
import billingRoutes from '../backend/routes/billingRoutes.js';
import careerProfileRoutes from '../backend/routes/careerProfileRoutes.js';
import jobDiscoveryRoutes from '../backend/routes/jobDiscoveryRoutes.js';
import resumeRoutes from '../backend/routes/resumeRoutes.js';
import coverLetterRoutes from '../backend/routes/coverLetterRoutes.js';
import applicationOrchestratorRoutes from '../backend/routes/applicationOrchestratorRoutes.js';
import v2Routes from '../backend/routes/v2Routes.js';
import advancedCandidateIntelligenceRoutes from '../backend/routes/advancedCandidateIntelligenceRoutes.js';
import jobAggregationRoutes from '../backend/routes/jobAggregationRoutes.js';

// Import routes — new infrastructure
import metricsRoutes               from '../backend/routes/metricsRoutes.js';
import companyConnectorRoutes      from '../backend/routes/companyConnectorRoutes.js';
import applicationTrackingRoutes   from '../backend/routes/applicationTrackingRoutes.js';

// Import middleware
import { globalErrorHandler, notFoundHandler } from '../backend/middleware/errorHandler.js';
import { requestId }               from '../backend/middleware/requestId.js';
import { auditMiddleware }         from '../backend/middleware/auditMiddleware.js';
import { authLimiter, globalLimiter } from '../backend/middleware/rateLimiters.js';
import config from '../backend/config/index.js';

// ── Services ──────────────────────────────────────────────────────────────────
import JobQueueService     from '../backend/services/JobQueueService.js';
import SchedulerService    from '../backend/services/SchedulerService.js';
import NotificationService from '../backend/services/NotificationService.js';
import logger              from '../backend/utils/logger.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(requestId);                  // Attach X-Request-ID to every request
app.use(helmet());                   // Security headers
app.use(cors(config.cors));          // Enable CORS
app.use(compression());              // Compress responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));         // HTTP request logging

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api/', globalLimiter);

// ── Audit Logging ─────────────────────────────────────────────────────────────
app.use(auditMiddleware);

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Auth-specific rate limit ──────────────────────────────────────────────────
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh',  authLimiter);

// ── Existing API Routes ───────────────────────────────────────────────────────
app.use('/api/auth',                          authRoutes);
app.use('/api/jobs',                          jobRoutes);
app.use('/api/ai',                            aiMatchingRoutes);
app.use('/api/agents',                        agentRoutes);
app.use('/api/embeddings',                    embeddingRoutes);
app.use('/api/interviews',                    interviewRoutes);
app.use('/api/learning',                      learningRoutes);
app.use('/api/roadmaps',                      roadmapRoutes);
app.use('/api/portfolio',                     portfolioRoutes);
app.use('/api/notifications',                 notificationRoutes);
app.use('/api/analytics',                     analyticsRoutes);
app.use('/api/billing',                       billingRoutes);
app.use('/api/career-profile',                careerProfileRoutes);
app.use('/api/job-discovery',                 jobDiscoveryRoutes);
app.use('/api/resumes',                       resumeRoutes);
app.use('/api/cover-letters',                 coverLetterRoutes);
app.use('/api/application-orchestrator',      applicationOrchestratorRoutes);
app.use('/api/v2',                            v2Routes);
app.use('/api/advanced-candidate-intelligence', advancedCandidateIntelligenceRoutes);
app.use('/api/job-aggregation',               jobAggregationRoutes);

// ── New Infrastructure Routes ─────────────────────────────────────────────────
app.use('/api',                               metricsRoutes);           // /api/metrics, /api/health/*
app.use('/api/company-connectors',            companyConnectorRoutes);  // Phase 8
app.use('/api/applications',                  applicationTrackingRoutes); // Phase 9

// Health check (simple — detailed version is at /api/health/detailed via metricsRoutes)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Job Agent API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    requestId: req.requestId,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // Join room based on user ID
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  // Join room based on role
  socket.on('join-role-room', (role) => {
    socket.join(`role-${role}`);
  });
});

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection - for development, we'll continue even if it fails
    const connected = await testConnection();
    let dbConnected = connected;

    if (connected && config.nodeEnv === 'development') {
      await syncDatabase(false); // false = don't force recreate tables
    }

    // ── Queue Service ────────────────────────────────────────────────────────
    try {
      await JobQueueService.initialize();

      // Register all BullMQ worker processors
      const { processors: agentProcessors } = await import('../backend/workers/agentWorkerProcessors.js');
      const { default: jobSyncProcessor }  = await import('../backend/workers/jobSyncWorkerProcessor.js');
      const { notificationProcessors }     = await import('../backend/workers/notificationWorkerProcessors.js');

      JobQueueService.createWorkers({
        ...agentProcessors,
        jobAggregation: jobSyncProcessor,
        notifications:  notificationProcessors.notifications,
        emailDigests:   notificationProcessors.emailDigests,
      });

      logger.info('BullMQ workers registered');
    } catch (queueErr) {
      logger.warn(`Queue initialisation failed (running without queues): ${queueErr.message}`);
    }

    // ── Scheduler ────────────────────────────────────────────────────────────
    try {
      SchedulerService.start();
    } catch (schedErr) {
      logger.warn(`Scheduler failed to start: ${schedErr.message}`);
    }

    // ── Notification Service — inject Socket.IO instance ─────────────────────
    NotificationService.setSocketIO(io);

    // Start server regardless of database connection (for development testing)
    const PORT = config.port;
    httpServer.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 AI Job Agent API Server                          ║
║   📡 Server running on port ${PORT}                     ║
║   🌍 Environment: ${config.nodeEnv.padEnd(33)}║
║   🕐 Started at: ${new Date().toISOString().padEnd(25)}║
║   ${dbConnected ? '✅ Database connected' : '⚠️  Database NOT connected (development mode)'}║
║   ${JobQueueService.initialized ? '✅ Queue service ready' : '⚠️  Queue service unavailable'}║
║   ${SchedulerService.started ? '✅ Scheduler running' : '⚠️  Scheduler not started'}║
║                                                        ║
║   Endpoints:                                           ║
║   - API:       http://localhost:${PORT}/api            ║
║   - Health:    http://localhost:${PORT}/api/health/live║
║   - Metrics:   http://localhost:${PORT}/api/metrics    ║
║   - WebSocket: ws://localhost:${PORT}                  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Error during server startup:', error);
    // Still start the server even if there's an error (for development)
    const PORT = config.port;
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} (degraded mode — check logs)`);
    });
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  SchedulerService.stop();
  await JobQueueService.shutdown().catch(() => {});
  httpServer.close(() => {
    sequelize.close();
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, httpServer, io };
export default app;