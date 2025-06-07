import React from 'react';
import { Composition, staticFile } from 'remotion';
import { z } from 'zod';
import { QuizScene } from './components/QuizScene';
import { BackgroundStyle } from './components/backgrounds';

// Constants for video dimensions and timing
export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInSeconds: 10
} as const;

// Props validation schema
export const schema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  backgroundStyle: z.enum(['gradient', 'particles', 'waves']),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  questionAudioPath: z.string().optional(),
  optionAudioPaths: z.array(z.string()).optional(),
  durationInFrames: z.number()
});

export type QuizCompositionProps = z.infer<typeof schema>;

export const Quiz: React.FC = () => {
  return (
    <>
      <Composition
        id="QuizScene"
        component={QuizScene}
        durationInFrames={VIDEO_CONFIG.durationInSeconds * VIDEO_CONFIG.fps}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        schema={schema}
        defaultProps={{
          question: "What is the capital of India?",
          options: ["Mumbai", "New Delhi", "Chennai", "Kolkata"],
          backgroundStyle: "gradient",
          primaryColor: "#4A90E2",
          secondaryColor: "#9B51E0",
          questionAudioPath: staticFile("audio/question.mp3"),
          optionAudioPaths: [
            staticFile("audio/option1.mp3"),
            staticFile("audio/option2.mp3"),
            staticFile("audio/option3.mp3"),
            staticFile("audio/option4.mp3"),
          ],
          durationInFrames: VIDEO_CONFIG.durationInSeconds * VIDEO_CONFIG.fps,
        }}
      />
    </>
  );
};
