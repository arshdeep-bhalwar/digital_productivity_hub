import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, validateEnv } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import aiRoutes from './routes/ai.routes.js';
import plannerRoutes from './routes/planner.routes.js';
import focusRoutes from './routes/focus.routes.js';
import projectRoutes from './routes/project.routes.js';
import goalRoutes from './routes/goal.routes.js';
import habitRoutes from './routes/habit.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

validateEnv();

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow local script/style tags and CDN assets
  })
);

// CORS restricted to app origin
app.use(
  cors({
    origin: config.appOrigin || '*',
    credentials: true,
  })
);

// Request body size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static frontend assets
app.use(express.static(rootDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supabaseConfigured: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      geminiConfigured: Boolean(config.geminiApiKey),
    },
    message: 'Digital Productivity Hub API is operational',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/analytics', analyticsRoutes);


// Centralized error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.NODE_TEST_CONTEXT && !process.env.PORT_NO_LISTEN) {
  app.listen(config.port, () => {
    console.log(`[SERVER] Digital Productivity Hub running on port ${config.port}`);
  });
}

export default app;
