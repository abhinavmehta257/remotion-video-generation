export * from './api.js';
export type { BackgroundStyle } from '../components/backgrounds/index.js';
export type { QuizCompositionProps } from '../Quiz.js';

// Job queue types
export interface QueuedJob<T = any> {
  id: string;
  data: T;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}

// Environment configuration
export interface EnvConfig {
  port: number;
  azureSpeech: {
    key: string;
    region: string;
  };
  azureStorage: {
    connectionString: string;
    containerName: string;
  };
  apiKey: string;
  video: {
    width: number;
    height: number;
    fps: number;
    durationInSeconds: number;
  };
}

// Error types
export class VideoGenerationError extends Error {
  constructor(message: string, public jobId?: string) {
    super(message);
    this.name = 'VideoGenerationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
