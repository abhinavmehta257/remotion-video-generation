import express from 'express';
import path from 'path';
import os from 'os';

class StaticFileServer {
  private app: express.Application;
  private httpServer: any;
  private port: number;
  private isServerReady: boolean = false;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.STATIC_SERVER_PORT || '3001', 10);

    // Add CORS support
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // Add content types
    this.app.use((_req, res, next) => {
      if (_req.path.endsWith('.mp3')) {
        res.type('audio/mpeg');
      }
      next();
    });

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', ready: this.isServerReady });
    });

    // Serve the temp directory
    this.app.use('/temp', express.static(path.join(os.tmpdir(), 'quiz-video-generator-temp'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp3')) {
          res.set('Content-Type', 'audio/mpeg');
        }
      },
    }));
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, () => {
        this.isServerReady = true;
        console.log(`Static file server running at http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  isReady(): boolean {
    return this.isServerReady;
  }

  getUrl(filePath: string): string {
    const relativePath = path.relative(path.join(os.tmpdir(), 'quiz-video-generator-temp'), filePath);
    return `http://localhost:${this.port}/${relativePath}`;
  }

  async shutdown(): Promise<void> {
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer.close(() => resolve());
      });
    }
  }
}

// Export singleton instance
export const staticServer = new StaticFileServer();
