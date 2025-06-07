import { z } from 'zod';
import { EnvConfig, ConfigurationError } from '../types/index.js';

// Environment variable validation schema
const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  AZURE_SPEECH_KEY: z.string().min(1),
  AZURE_SPEECH_REGION: z.string().min(1),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1),
  AZURE_STORAGE_CONTAINER_NAME: z.string().min(1),
  API_KEY: z.string().min(1),
  VIDEO_WIDTH: z.string().transform(Number).default('1080'),
  VIDEO_HEIGHT: z.string().transform(Number).default('1920'),
  VIDEO_FPS: z.string().transform(Number).default('30'),
  VIDEO_DURATION_SECONDS: z.string().transform(Number).default('10'),
});

export function loadConfig(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);

    return {
      port: env.PORT,
      azureSpeech: {
        key: env.AZURE_SPEECH_KEY,
        region: env.AZURE_SPEECH_REGION,
      },
      azureStorage: {
        connectionString: env.AZURE_STORAGE_CONNECTION_STRING,
        containerName: env.AZURE_STORAGE_CONTAINER_NAME,
      },
      apiKey: env.API_KEY,
      video: {
        width: env.VIDEO_WIDTH,
        height: env.VIDEO_HEIGHT,
        fps: env.VIDEO_FPS,
        durationInSeconds: env.VIDEO_DURATION_SECONDS,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map(issue => issue.path.join('.'))
        .join(', ');
      throw new ConfigurationError(
        `Missing or invalid environment variables: ${missingVars}`
      );
    }
    throw error;
  }
}

// Singleton instance
export const config = loadConfig();
