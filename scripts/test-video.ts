import { videoGenerator } from '../src/services/video-generator';
import { VideoRequest } from '../src/types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const sampleRequest: VideoRequest = {
  questions: [
    {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctAnswer: 1
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
      correctAnswer: 1
    }
  ],
  style: {
    backgroundStyle: "gradient",
    primaryColor: "#4A90E2",
    secondaryColor: "#9B51E0"
  },
  voice: {
    locale: "en-US",
    name: "en-US-JennyNeural"
  }
};

async function testVideoGeneration() {
  try {
    console.log('Starting test video generation...');
    const jobId = `test-${Date.now()}`;
    const url = await videoGenerator.generateVideo(jobId, sampleRequest);
    console.log('Video generated successfully!');
    console.log('URL:', url);
  } catch (error) {
    console.error('Error generating test video:', error);
    process.exit(1);
  }
}

async function testAllBackgrounds() {
  const backgrounds: ("gradient" | "particles" | "waves")[] = ["gradient", "particles", "waves"];
  
  for (const background of backgrounds) {
    try {
      console.log(`Testing ${background} background...`);
      const jobId = `test-${background}-${Date.now()}`;
      const request = {
        ...sampleRequest,
        style: {
          ...sampleRequest.style,
          backgroundStyle: background
        }
      };
      const url = await videoGenerator.generateVideo(jobId, request);
      console.log(`${background} background test successful!`);
      console.log('URL:', url);
    } catch (error) {
      console.error(`Error testing ${background} background:`, error);
    }
  }
}

// Run the tests
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--all-backgrounds')) {
    testAllBackgrounds().catch(console.error);
  } else {
    testVideoGeneration().catch(console.error);
  }
}
