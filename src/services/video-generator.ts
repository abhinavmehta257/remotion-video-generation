import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { azureStorage } from './azure-storage.js';
import { azureSpeech } from './azure-speech.js';
import { VideoRequest } from '../types/api.js';
import { cleanup } from '../utils/cleanup.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import { staticServer } from '../utils/static-server.js';

class VideoGeneratorService {
  private async generateTTSForQuestions(
    jobId: string,
    questions: Array<{ question: string; options: string[] }>,
    voice?: { locale: string; name: string }
  ): Promise<Array<{ questionAudio: string; optionAudios: string[] }>> {
    logger.startOperation('generateTTSForQuestions', { jobId });
    
    try {
      const jobDir = cleanup.createJobDir(jobId);
      logger.debug('Created job directory', jobId, { dir: jobDir });

      const audioFiles = await Promise.all(
        questions.map(async (q, index) => {
          const questionDir = path.join(jobDir, `question_${index}`);
          fs.mkdirSync(questionDir, { recursive: true });

          logger.debug('Generating audio for question', jobId, {
            questionIndex: index,
            text: q.question
          });

          // Generate audio for question
          const questionAudioPath = path.join(questionDir, 'question.mp3');
          await azureSpeech.textToSpeech(q.question, questionAudioPath, voice);

          // Generate audio for options
          const optionAudioPaths = await Promise.all(
            q.options.map(async (option, optIndex) => {
              logger.debug('Generating audio for option', jobId, {
                questionIndex: index,
                optionIndex: optIndex,
                text: option
              });

              const optionPath = path.join(questionDir, `option_${optIndex}.mp3`);
              await azureSpeech.textToSpeech(option, optionPath, voice);
              return optionPath;
            })
          );

          return {
            questionAudio: questionAudioPath,
            optionAudios: optionAudioPaths
          };
        })
      );

      logger.endOperation('generateTTSForQuestions', { 
        jobId,
        details: {
          questionsProcessed: questions.length,
          totalAudioFiles: questions.length * (1 + Math.max(...questions.map(q => q.options.length)))
        }
      });

      return audioFiles;
    } catch (error) {
      if (error instanceof Error) {
        logger.failOperation('generateTTSForQuestions', error, { jobId });
      } else {
        logger.failOperation('generateTTSForQuestions', new Error('Unknown error occurred'), { jobId });
      }
      throw error;
    }
  }

  async generateVideo(jobId: string, request: VideoRequest): Promise<string> {
    logger.startOperation('generateVideo', { jobId });

    try {
      // Register job with cleanup service
      cleanup.registerJob(jobId);

      // Ensure static server is ready
      if (!staticServer.isReady()) {
        throw new Error('Static file server is not ready. Please try again in a few seconds.');
      }
      // Generate TTS for all questions
      const localAudioFiles = await this.generateTTSForQuestions(
        jobId,
        request.questions,
        request.voice
      );

      // Convert local paths to HTTP URLs
      // Convert local paths to HTTP URLs and validate they are accessible
      const audioFiles = localAudioFiles.map(audio => {
        const questionAudioUrl = staticServer.getUrl(audio.questionAudio);
        const optionAudioUrls = audio.optionAudios.map(path => staticServer.getUrl(path));

        // Log URLs for debugging
        logger.debug('Audio URLs generated for question', jobId, {
          questionAudio: questionAudioUrl,
          optionAudios: optionAudioUrls
        });

        return {
          questionAudio: questionAudioUrl,
          optionAudios: optionAudioUrls
        };
      });

      logger.debug('Converted audio file paths to URLs', jobId, {
        questionAudio: audioFiles[0].questionAudio,
        optionAudios: audioFiles[0].optionAudios
      });

      logger.debug('Bundling video components', jobId);
      const bundled = await bundle(path.join(process.cwd(), 'src/index.ts'));

      logger.debug('Configuring video composition', jobId, {
        questionCount: request.questions.length,
        style: request.style
      });

      // Set video configuration
      // Validate audio URLs are accessible
      const validateUrl = async (url: string) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to validate audio URL: ${url}`);
          }
        } catch (error) {
          logger.error('Audio URL validation failed', jobId, error as Error, { url });
          throw error;
        }
      };

      // Validate all audio URLs
      await Promise.all([
        validateUrl(audioFiles[0].questionAudio),
        ...audioFiles[0].optionAudios.map(validateUrl)
      ]);

      const compositionProps = {
        question: request.questions[0].question,
        options: request.questions[0].options,
        backgroundStyle: request.style.backgroundStyle,
        primaryColor: request.style.primaryColor,
        secondaryColor: request.style.secondaryColor,
        questionAudioPath: audioFiles[0].questionAudio,
        optionAudioPaths: audioFiles[0].optionAudios,
        durationInFrames: 300 // 10 seconds at 30fps
      };

      // Use the same props for both composition and rendering
      const comps = await selectComposition({
        serveUrl: bundled,
        id: 'QuizScene',
        inputProps: compositionProps
      });

      // Get the job directory and prepare for rendering
      const jobDir = path.join(process.cwd(), 'temp', jobId);
      const outputPath = path.join(jobDir, 'output.mp4');

      logger.debug('Starting video rendering', jobId);

      // Render the video
      await renderMedia({
        composition: comps,
        serveUrl: bundled,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: compositionProps
      });

      logger.debug('Video rendering completed', jobId);

      // Upload to Azure Storage
      const videoData = fs.readFileSync(outputPath);
      logger.debug('Uploading video to storage', jobId);
      const url = await azureStorage.uploadVideo(videoData, jobId);

      // Unregister job before cleanup
      cleanup.unregisterJob(jobId);

      // Cleanup temporary files
      logger.debug('Cleaning up temporary files', jobId);
      await cleanup.cleanupJob(jobId);

      logger.endOperation('generateVideo', { jobId, details: { url } });
      return url;
    } catch (error) {
      // Ensure cleanup on error
      cleanup.unregisterJob(jobId);
      await cleanup.cleanupJob(jobId);
      if (error instanceof Error) {
        logger.failOperation('generateVideo', error, { jobId });
      } else {
        logger.failOperation('generateVideo', new Error('Unknown error occurred'), { jobId });
      }
      throw error;
    }
  }

  async deleteVideo(url: string): Promise<void> {
    try {
      logger.startOperation('deleteVideo', { details: { url } });
      await azureStorage.deleteVideo(url);
      logger.endOperation('deleteVideo');
    } catch (error) {
      if (error instanceof Error) {
        logger.failOperation('deleteVideo', error, { details: { url } });
      } else {
        logger.failOperation('deleteVideo', new Error('Unknown error occurred'), { details: { url } });
      }
      throw error;
    }
  }
}

export const videoGenerator = new VideoGeneratorService();
