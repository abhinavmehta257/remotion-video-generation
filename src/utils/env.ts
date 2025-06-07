import dotenv from 'dotenv';
import { ConfigurationError } from '../types/index.js';

// Load environment variables
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}
console.log('Loaded environment variables:', {
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY ? '***' : undefined,
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION,
  AZURE_SPEECH_ENDPOINT: process.env.AZURE_SPEECH_ENDPOINT,
  AZURE_SPEECH_DEPLOYMENT: process.env.AZURE_SPEECH_DEPLOYMENT,
  AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING ? '***' : undefined,
  AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME
});

export function loadEnv() {
  const missingVars = [];
  const requiredVars = [
    'AZURE_SPEECH_KEY',
    'AZURE_SPEECH_REGION',
    'AZURE_SPEECH_ENDPOINT',
    'AZURE_SPEECH_DEPLOYMENT',
    'AZURE_SPEECH_API_VERSION',
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_STORAGE_CONTAINER_NAME'
  ];

  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    azure: {
      speech: {
        key: process.env.AZURE_SPEECH_KEY!,
        region: process.env.AZURE_SPEECH_REGION!,
        endpoint: process.env.AZURE_SPEECH_ENDPOINT!,
        deployment: process.env.AZURE_SPEECH_DEPLOYMENT!,
        apiVersion: process.env.AZURE_SPEECH_API_VERSION!,
        defaultVoice: process.env.AZURE_SPEECH_DEFAULT_VOICE || 'nova',
        defaultLocale: process.env.AZURE_SPEECH_DEFAULT_LOCALE || 'en-US'
      },
      storage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
        retentionDays: parseInt(process.env.AZURE_STORAGE_RETENTION_DAYS || '7', 10)
      }
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      staticPort: parseInt(process.env.STATIC_SERVER_PORT || '3001', 10),
      apiKey: process.env.API_KEY || 'development_api_key'
    },
    video: {
      width: parseInt(process.env.VIDEO_WIDTH || '1080', 10),
      height: parseInt(process.env.VIDEO_HEIGHT || '1920', 10),
      fps: parseInt(process.env.VIDEO_FPS || '30', 10),
      durationInSeconds: parseInt(process.env.VIDEO_DURATION_SECONDS || '10', 10)
    }
  } as const;
}

// Export singleton instance
export const env = loadEnv();
