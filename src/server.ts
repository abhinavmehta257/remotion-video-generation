import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticateApiKey } from './middleware/auth.js';
import { videoRoutes } from './routes/video.js';
import { azureStorage } from './services/azure-storage.js';
import { env } from './utils/env.js';
import { staticServer } from './utils/static-server.js';
import { cleanup } from './utils/cleanup.js';

const app = express();
const port = env.server.port;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(authenticateApiKey);

// Initialize Azure Storage
azureStorage.initializeContainer().catch(console.error);

// Mount API routes
app.use('/api', videoRoutes);

// Initialize servers
const initializeServers = async () => {
  try {
    // Wait for static server to be ready
    await staticServer['readyPromise'];
    console.log(`Static file server initialized on port ${env.server.staticPort}`);

    // Start main server
    const server = app.listen(port, () => {
      console.log(`Main server running on port ${port}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Received shutdown signal. Starting graceful shutdown...');

      try {
        // Close main server first
        await new Promise<void>((resolve) => {
          server.close(() => {
            console.log('Main server closed');
            resolve();
          });
        });

        // Then stop static server
        await staticServer.shutdown();
        console.log('Static server closed');

        // Finally cleanup temp files
        await cleanup.cleanupAllJobs();
        console.log('All temporary files cleaned up');

        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Failed to initialize servers:', error);
    // Ensure cleanup of any existing files before exit
    try {
      await cleanup.cleanupAllJobs();
    } catch (cleanupError) {
      console.error('Failed to cleanup before exit:', cleanupError);
    }
    process.exit(1);
  }
};

// Start servers
initializeServers().catch((error) => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});
