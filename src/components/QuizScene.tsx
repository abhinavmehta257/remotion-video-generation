import React from 'react';
import { AbsoluteFill, Audio, useCurrentFrame, spring, useVideoConfig, delayRender, continueRender } from 'remotion';
import { GradientBackground } from './backgrounds/GradientBackground';
import { ParticlesBackground } from './backgrounds/ParticlesBackground';
import { WavesBackground } from './backgrounds/WavesBackground';
import { BackgroundStyle } from './backgrounds';
import type { z } from 'zod';
import { schema } from '../Quiz';

type QuizSceneProps = z.infer<typeof schema>;

const AudioWithFallback: React.FC<{ src: string; startFrom?: number }> = ({ src, startFrom = 0 }) => {
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [handle] = React.useState(() => delayRender());

  React.useEffect(() => {
    const audio = new window.Audio();
    
    const loadAudio = () => {
      try {
        setLoading(true);
        audio.src = src;

        // First try to load as URL
        fetch(src)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error: ${response.status}`);
            }
            return response;
          })
          .catch(e => {
            throw new Error(`Network error: ${e.message}`);
          });
        
        audio.oncanplaythrough = () => {
          setLoading(false);
          continueRender(handle);
        };

        audio.onerror = (e: Event | string) => {
          const mediaError = audio.error;
          const error = new Error(`Failed to load audio at ${src}: ${mediaError?.message || 'unknown error'}`);
          console.error(error);
          setError(error);
          // Give time for error to be properly logged before continuing
          setTimeout(() => {
            continueRender(handle);
          }, 100);
        };

      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error occurred');
        console.error(error);
        setError(error);
        // Give time for error to be properly logged before continuing
        setTimeout(() => {
          continueRender(handle);
        }, 100);
      }
    };

    loadAudio();

    return () => {
      audio.oncanplaythrough = null;
      audio.onerror = null;
    };
  }, [src, handle]);

  if (error) {
    console.error('Audio loading error:', error);
    return null;
  }

  if (loading) {
    return null;
  }

  return <Audio src={src} startFrom={startFrom} />;
};

export const QuizScene: React.FC<QuizSceneProps> = ({
  question,
  options,
  backgroundStyle = 'gradient',
  primaryColor = '#4A90E2',
  secondaryColor = '#9B51E0',
  questionAudioPath,
  optionAudioPaths = [],
  durationInFrames
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in text animations
  const questionOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    delay: 30,
    durationInFrames: 60
  });

  const optionsOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    delay: 90,
    durationInFrames: 60
  });

  // Determine which background component to use
  const Background = React.useMemo(() => {
    switch (backgroundStyle) {
      case 'particles':
        return ParticlesBackground;
      case 'waves':
        return WavesBackground;
      default:
        return GradientBackground;
    }
  }, [backgroundStyle]);

  return (
    <AbsoluteFill>
      <Background
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Audio elements */}
      {questionAudioPath && (
        <AudioWithFallback
          src={questionAudioPath}
          startFrom={0}
        />
      )}

      {/* Question text */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          width: '80%',
          left: '10%',
          textAlign: 'center',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          opacity: questionOpacity,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {question}
      </div>

      {/* Options */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          width: '80%',
          left: '10%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          opacity: optionsOpacity
        }}
      >
        {options.map((option: string, idx: number) => {
          // Stagger option animations
          const optionDelay = 90 + idx * 15;
          const optionScale = spring({
            frame,
            fps,
            from: 0.8,
            to: 1,
            delay: optionDelay,
            durationInFrames: 60
          });

          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 12,
                padding: '15px 25px',
                fontSize: 36,
                color: '#000000',
                transform: `scale(${optionScale})`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {String.fromCharCode(65 + idx)}. {option}
              {optionAudioPaths[idx] && (
                <AudioWithFallback
                  src={optionAudioPaths[idx]}
                  startFrom={optionDelay / fps}
                />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
