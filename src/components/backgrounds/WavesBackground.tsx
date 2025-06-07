import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface WavesBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  waveCount?: number;
}

export const WavesBackground: React.FC<WavesBackgroundProps> = ({
  primaryColor = '#4A90E2',
  secondaryColor = '#9B51E0',
  waveCount = 3
}) => {
  const frame = useCurrentFrame();

  // Create multiple waves with different phases and amplitudes
  const waves = Array.from({ length: waveCount }).map((_, i) => {
    const phase = interpolate(
      frame,
      [0, 200],
      [0, Math.PI * 2],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      }
    );

    const amplitude = 20 + i * 10;
    const frequency = 0.005 - i * 0.001;

    return { phase, amplitude, frequency };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      {waves.map((wave, waveIndex) => (
        <svg
          key={waveIndex}
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            opacity: 0.3 + waveIndex * 0.2
          }}
          preserveAspectRatio="none"
        >
          <path
            d={`
              M 0 ${1920 / 2}
              ${Array.from({ length: 1080 + 50 }).map((_, i) => {
                const x = i * 10;
                const y =
                  1920 / 2 +
                  Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
                return `L ${x} ${y}`;
              }).join(' ')}
              L 1080 1920
              L 0 1920
              Z
            `}
            fill={waveIndex % 2 === 0 ? primaryColor : secondaryColor}
          />
        </svg>
      ))}
    </AbsoluteFill>
  );
};
