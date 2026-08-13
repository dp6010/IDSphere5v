import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { setupApiRoutes } from '../src/server/api.js';

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-oauth-access-token']
}));

app.use(express.json());

// Diagnostics middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[API Diagnostic] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} Content-Type: ${res.getHeader('Content-Type')}`);
  });
  next();
});

// API Routes
setupApiRoutes(app, upload);

// Catch-all for unhandled /api/* routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API Route Not Found: ${req.method} ${req.originalUrl}` });
});

export default app;
