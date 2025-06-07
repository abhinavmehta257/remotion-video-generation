import { BackgroundStyle } from '../components/backgrounds/index.js';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  duration?: number;
}

export interface VideoRequest {
  questions: QuizQuestion[];
  style: {
    backgroundStyle: BackgroundStyle;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  voice?: {
    locale: string;
    name: string;
  };
}

export interface VideoResponse {
  jobId: string;
  status: 'processing';
  error?: string;
}

export interface VideoStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  progress?: number;
}

export interface BaseResponse {
  success: boolean;
  error?: string;
}

// Job status tracking
export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  progress?: number;
}
