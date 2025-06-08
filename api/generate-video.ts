import { VercelRequest, VercelResponse } from '@vercel/node';
import { z, ZodError } from 'zod';
import { videoGenerator } from '../src/services/video-generator.js';
import { staticServer } from '../src/utils/static-server.js';
import { random } from 'remotion';

let staticStarted = false;
async function ensureStaticServer() {
  if (!staticStarted) {
    await staticServer.start();
    staticStarted = true;
  }
}

// Validation schema matching your existing /routes/video.ts
const videoRequestSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2).max(4),
        correctAnswer: z.number().min(0),
      })
    )
    .min(1),
  style: z.object({
    backgroundStyle: z.enum(['gradient', 'particles', 'waves']),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
  }),
  voice: z
    .object({
      locale: z.string(),
      name: z.string(),
    })
    .optional(),
  // Optional token in body if you require auth:
  token: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  await ensureStaticServer();

  let data;
  try {
    data = videoRequestSchema.parse(req.body);
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid request body', details: err.errors });
    }
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Optional auth check
  if (data.token && data.token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Generate a unique jobId for temp directories
  const jobId = random(null).toString(36).substring(2);

  try {
    const url = await videoGenerator.generateVideo(jobId, {
      questions: data.questions,
      style: data.style,
      voice: data.voice,
    });
    return res.status(200).json({ url });
  } catch (err: unknown) {
    console.error('Video generation error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return res
      .status(500)
      .json({ error: 'Video generation failed', details: message });
  }
}
