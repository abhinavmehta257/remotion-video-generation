# Quiz Video Generator

Generate dynamic quiz videos with text-to-speech and animated backgrounds using Remotion and Azure Services.

## Features

- 📹 Generate quiz videos with animated backgrounds
- 🗣️ Text-to-speech using Azure Cognitive Services
- 🎨 Multiple background styles (Gradient, Particles, Waves)
- 🎯 REST API for video generation
- ☁️ Azure Storage for video hosting
- 🔄 Asynchronous job processing

## Prerequisites

1. Node.js (v18 or later)
2. Azure Account with:
   - Azure Speech Service
   - Azure Storage Account

## Environment Variables

Create a `.env` file with the following variables:

```env
# Azure Speech Service
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=your_region

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER_NAME=quiz-videos
AZURE_STORAGE_RETENTION_DAYS=7

# API Authentication
API_KEY=your_secure_api_key

# Server Configuration
PORT=3000

# Logging Configuration
LOG_LEVEL=debug
LOG_TO_FILE=false

# Video Configuration
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
VIDEO_FPS=30
VIDEO_DURATION_SECONDS=10
```

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd quiz-video-generator

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Development

```bash
# Start the API server in development mode
npm run dev

# Start Remotion Studio for video preview
npm run dev:remotion

# Build the project
npm run build

# Render a test video
npm run build:video
```

## Testing

The project includes test scripts for verifying video generation:

```bash
# Test basic video generation
npm run test:video

# Test all background styles
npm run test:backgrounds

# Clean temporary files and output
npm run clean
```

### Testing Different Components

1. **Background Styles**
   ```bash
   npm run test:backgrounds
   ```
   This will generate test videos with all available background styles.

2. **Single Video Generation**
   ```bash
   npm run test:video
   ```
   Generates a sample quiz video with default settings.

3. **Manual Testing via API**
   ```bash
   curl -X POST http://localhost:3000/api/generate-video \
     -H "Content-Type: application/json" \
     -H "x-api-key: your_api_key" \
     -d @example/request.json
   ```

## API Endpoints

### Generate Video

```http
POST /api/generate-video
Content-Type: application/json
x-api-key: your_api_key

{
  "questions": [
    {
      "question": "What is the capital of India?",
      "options": ["Mumbai", "New Delhi", "Chennai", "Kolkata"],
      "correctAnswer": 1
    }
  ],
  "style": {
    "backgroundStyle": "gradient",
    "primaryColor": "#4A90E2",
    "secondaryColor": "#9B51E0"
  },
  "voice": {
    "locale": "en-US",
    "name": "en-US-JennyNeural"
  }
}
```

Response:
```json
{
  "jobId": "abc123",
  "status": "processing"
}
```

### Check Video Status

```http
GET /api/video-status/:jobId
x-api-key: your_api_key
```

Response:
```json
{
  "status": "completed",
  "url": "https://your-storage-account.blob.core.windows.net/quiz-videos/video.mp4",
  "progress": 100
}
```

### Delete Video

```http
DELETE /api/video/:jobId
x-api-key: your_api_key
```

Response:
```
204 No Content
```

## Project Structure

```
src/
├── components/          # React/Remotion components
│   ├── backgrounds/    # Background animations
│   └── QuizScene.tsx   # Main quiz scene
├── services/           # Azure services integration
├── utils/             # Utility functions
├── routes/            # API routes
├── types/             # TypeScript types
└── server.ts          # Express API server

scripts/
└── test-video.ts      # Test utilities

temp/                  # Temporary files
└── .gitkeep

out/                   # Rendered videos
└── .gitkeep
```

## Error Handling

The API includes comprehensive error handling:

- Input validation using Zod
- Azure service error handling
- File system error handling
- Job status tracking
- Cleanup of temporary files

## Logging

Logging is configurable via environment variables:

- `LOG_LEVEL`: debug, info, warn, or error
- `LOG_TO_FILE`: true/false for file logging

Logs include:
- Operation tracking
- Error details
- Job progress
- Azure service interactions

## License

Private - All rights reserved
