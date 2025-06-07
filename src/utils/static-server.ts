import express from 'express';
import path from 'path';
import { env } from './env.js';

class StaticFileServer {
  private app: express.Application;
  private httpServer: any;
  private port: number;
  private isServerReady: boolean = false;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.STATIC_SERVER_PORT || '3001', 10);
    
    // Add CORS support
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // Add content types
    this.app.use((req, res, next) => {
      if (req.path.endsWith('.mp3')) {
        res.type('audio/mpeg');
      }
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', ready: this.isServerReady });
    });
    
    // Serve the temp directory with custom options
    this.app.use('/temp', express.static(path.join(process.cwd(), 'temp'), {
      setHeaders: (res, path) => {
        if (path.endsWith('.mp3')) {
          res.set('Content-Type', 'audio/mpeg');
        }
      }
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
    // Convert absolute file path to relative path from project root
    const relativePath = path.relative(process.cwd(), filePath);
    return `http://localhost:${this.port}/${relativePath}`;
  }
}

class StaticServerManager {
  private server: StaticFileServer;
  private readyPromise: Promise<void>;

  constructor() {
    this.server = new StaticFileServer();
    this.readyPromise = this.server.start();
  }

  getUrl(filePath: string): string {
    return this.server.getUrl(filePath);
  }

  isReady(): boolean {
    return this.server.isReady();
  }

  async shutdown(): Promise<void> {
    if (this.server.isReady()) {
      await new Promise<void>((resolve) => {
        this.server['httpServer'].close(() => resolve());
      });
    }
  }
}

// Export singleton instance
export const staticServer = new StaticServerManager();
