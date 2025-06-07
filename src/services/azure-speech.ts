import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ConfigurationError } from '../types/index.js';
import { azureConfig, isValidVoiceName } from '../utils/azure-config.js';

export class AzureSpeechService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    try {
      console.log('Initializing Azure OpenAI TTS service with:', {
        region: azureConfig.speech.region,
        endpoint: azureConfig.speech.endpoint,
        deployment: azureConfig.speech.deployment,
        defaultLocale: azureConfig.speech.defaultLocale,
        defaultVoice: azureConfig.speech.defaultVoice
      });

      if (!azureConfig.speech.key || !azureConfig.speech.endpoint) {
        throw new Error('Missing required Azure OpenAI TTS configuration');
      }

      this.baseUrl = `${azureConfig.speech.endpoint}/openai/deployments/${azureConfig.speech.deployment}/audio/speech`;
      this.headers = {
        'api-key': azureConfig.speech.key,
        'Content-Type': 'application/json'
      };

      // Verify the service is accessible
      this.verifyService();
    } catch (error) {
      console.error('Azure OpenAI TTS Service initialization error:', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new ConfigurationError(`Failed to initialize Azure OpenAI TTS service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async verifyService(): Promise<void> {
    try {
      console.log('Verifying Azure OpenAI TTS service...');
      const response = await fetch(`${this.baseUrl}?api-version=${azureConfig.speech.apiVersion}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          input: 'Test',
          voice: azureConfig.speech.defaultVoice.toLowerCase()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Service verification failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('Azure OpenAI TTS service verified successfully');
    } catch (error) {
      console.error('Azure OpenAI TTS service verification failed:', error);
      throw error;
    }
  }

  async textToSpeech(
    text: string,
    outputPath: string,
    options: {
      locale?: string;
      voiceName?: string;
    } = {}
  ): Promise<void> {
    console.log('Starting text-to-speech conversion:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      outputPath,
      options
    });

    try {
      const { 
        voiceName = azureConfig.speech.defaultVoice
      } = options;

      // Validate voice format
      if (!isValidVoiceName(voiceName)) {
        throw new Error(`Invalid voice name format: ${voiceName}`);
      }

      // Ensure the output directory exists
      const dir = dirname(outputPath);
      mkdirSync(dir, { recursive: true });

      // Make request to Azure OpenAI TTS
      const response = await fetch(`${this.baseUrl}?api-version=${azureConfig.speech.apiVersion}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          input: text,
          voice: voiceName.toLowerCase()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Get audio data as ArrayBuffer
      const audioData = await response.arrayBuffer();

      // Write to file
      writeFileSync(outputPath, Buffer.from(audioData));
      console.log('Speech synthesis completed successfully');
    } catch (error) {
      console.error('Speech synthesis failed:', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Speech synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureJobDirectory(jobId: string): Promise<void> {
    const jobDir = `temp/${jobId}`;
    try {
await new Promise<void>((resolve) => {
        mkdirSync(jobDir, { recursive: true });
        resolve();
      });
    } catch (error) {
      console.error('Failed to create job directory:', {
        jobDir,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async generateQuestionAudio(
    jobId: string,
    questions: { question: string; options: string[] }[],
    options: { locale?: string; voiceName?: string } = {}
  ): Promise<Array<{ questionAudio: string; optionAudios: string[] }>> {
    try {
      // Ensure job directory exists
      await this.ensureJobDirectory(jobId);
      
      console.log('Starting audio generation for job:', {
        jobId,
        questionCount: questions.length,
        options
      });

      const audioFiles = await Promise.all(
        questions.map(async (q, index) => {
          // Generate audio for question
          const questionPath = `temp/${jobId}/question_${index}.mp3`;
          await this.textToSpeech(q.question, questionPath, options);

          // Generate audio for options
          const optionAudioPaths = await Promise.all(
            q.options.map(async (option, optIndex) => {
              const optionPath = `temp/${jobId}/question_${index}_option_${optIndex}.mp3`;
              const optionText = `Option ${String.fromCharCode(65 + optIndex)}: ${option}`;
              await this.textToSpeech(optionText, optionPath, options);
              return optionPath;
            })
          );

          return {
            questionAudio: questionPath,
            optionAudios: optionAudioPaths
          };
        })
      );

      return audioFiles;
    } catch (error) {
      console.error('Failed to generate audio:', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const azureSpeech = new AzureSpeechService();
