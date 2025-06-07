import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { VideoRequest, VideoStatusResponse } from '../types/index.js';
import { videoGenerator } from '../services/video-generator.js';
import { handleError, APIError } from '../utils/error-handler.js';

const router = Router();

// Request validation schema
const videoRequestSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    correctAnswer: z.number().min(0)
  })).min(1),
  style: z.object({
    backgroundStyle: z.enum(['gradient', 'particles', 'waves']),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional()
  }),
  voice: z.object({
    locale: z.string(),
    name: z.string()
  }).optional()
});

// In-memory job storage (replace with proper database in production)
const jobs = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  progress?: number;
}>();

// Define route handlers
const generateVideoHandler = async (
  req: Request<{}, any, VideoRequest>,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = videoRequestSchema.parse(req.body);
    
    const jobId = Math.random().toString(36).substring(7);

    // Initialize job status
    jobs.set(jobId, {
      status: 'processing',
      progress: 0
    });

    // Start async video generation
    videoGenerator.generateVideo(jobId, validatedData)
      .then(url => {
        jobs.set(jobId, {
          status: 'completed',
          url,
          progress: 100
        });
      })
      .catch(error => {
        console.error(`Error processing job ${jobId}:`, error);
        jobs.set(jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Video generation failed',
          progress: 0
        });
      });

    res.status(202).json({
      jobId,
      status: 'processing'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request body',
        details: error.errors
      });
      return;
    }
    handleError(error instanceof Error ? error : new Error('Unknown error'), res);
  }
};

const getVideoStatusHandler = (
  req: Request<{ jobId: string }>,
  res: Response<VideoStatusResponse>
): void => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    res.json({
      status: job.status,
      url: job.url,
      error: job.error,
      progress: job.progress
    });
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Unknown error'), res);
  }
};

const deleteVideoHandler = async (
  req: Request<{ jobId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    if (job.url) {
      await videoGenerator.deleteVideo(job.url);
    }

    jobs.delete(jobId);
    res.status(204).send();
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Unknown error'), res);
  }
};

// Register routes
router.post('/generate-video', generateVideoHandler);
router.get('/video-status/:jobId', getVideoStatusHandler);
router.delete('/video/:jobId', deleteVideoHandler);

export { router as videoRoutes, jobs };
