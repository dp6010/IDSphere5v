import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { setupApiRoutes } from './src/server/api.js';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
