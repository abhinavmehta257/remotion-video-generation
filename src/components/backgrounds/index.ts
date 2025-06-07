import { GradientBackground } from './GradientBackground';
import { ParticlesBackground } from './ParticlesBackground';
import { WavesBackground } from './WavesBackground';

export type BackgroundStyle = 'gradient' | 'particles' | 'waves';

export const backgrounds = {
  gradient: GradientBackground,
  particles: ParticlesBackground,
  waves: WavesBackground
} as const;

export { GradientBackground, ParticlesBackground, WavesBackground };

export interface BackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  style?: BackgroundStyle;
}

export const getBackground = (style: BackgroundStyle = 'gradient') => {
  return backgrounds[style];
};
