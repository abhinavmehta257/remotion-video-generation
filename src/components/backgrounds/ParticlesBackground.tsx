import React from 'react';
import { AbsoluteFill, useCurrentFrame, random } from 'remotion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface ParticlesBackgroundProps {
  primaryColor?: string;
  particleCount?: number;
}

export const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({
  primaryColor = '#4A90E2',
  particleCount = 50
}) => {
  const frame = useCurrentFrame();
  
  // Generate particle positions
  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      x: random(`x-${i}`) * 100,
      y: random(`y-${i}`) * 100,
      size: random(`size-${i}`) * 4 + 2,
      speed: random(`speed-${i}`) * 2 + 0.5
    }));
  }, [particleCount]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        opacity: 0.9
      }}
    >
      {particles.map((particle, i) => {
        const x = (particle.x + frame * particle.speed) % 100;
        const y = particle.y;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: primaryColor,
              opacity: 0.6,
              transform: `scale(${
                1 + Math.sin(frame * 0.1 + random(`scale-${i}`) * 10) * 0.3
              })`
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
