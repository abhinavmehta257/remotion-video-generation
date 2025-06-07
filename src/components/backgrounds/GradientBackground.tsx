import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface GradientBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  primaryColor = '#4A90E2',
  secondaryColor = '#9B51E0'
}) => {
  const frame = useCurrentFrame();
  
  // Animate gradient rotation
  const rotation = interpolate(
    frame,
    [0, 150],
    [0, 360],
    {
      extrapolateRight: 'extend'
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${rotation}deg, ${primaryColor}, ${secondaryColor})`,
        opacity: 0.9
      }}
    />
  );
};
