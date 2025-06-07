import { env } from './env.js';

export interface AzureConfig {
  speech: {
    key: string;
    region: string;
    endpoint: string;
    deployment: string;
    apiVersion: string;
    defaultVoice: string;
    defaultLocale: string;
  };
  storage: {
    connectionString: string;
    containerName: string;
    retentionDays: number;
  };
}

// Export singleton instance
export const azureConfig: AzureConfig = env.azure;

// Azure OpenAI TTS allowed voices
const ALLOWED_VOICES = ['nova', 'shimmer', 'echo', 'onyx', 'fable', 'alloy'];

// Utility function to validate voice name
export function isValidVoiceName(voice: string): boolean {
  return ALLOWED_VOICES.includes(voice.toLowerCase());
}

// Utility function to validate locale format
export function isValidLocale(locale: string): boolean {
  // Example format: en-US
  const localePattern = /^[a-z]{2}-[A-Z]{2}$/;
  return localePattern.test(locale);
}
