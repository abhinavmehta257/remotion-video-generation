import { Response } from 'express';
import { VideoGenerationError, ConfigurationError } from '../types/index.js';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleError = (error: Error, res: Response): void => {
  console.error('Error:', error);

  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
    return;
  }

  if (error instanceof VideoGenerationError) {
    res.status(500).json({
      error: 'Video generation failed',
      details: error.message,
      jobId: error.jobId
    });
    return;
  }

  if (error instanceof ConfigurationError) {
    res.status(500).json({
      error: 'Server configuration error',
      details: error.message
    });
    return;
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
};

export const assertEnvVars = (vars: string[]): void => {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

export const validateRequestBody = <T>(
  body: any,
  required: (keyof T)[],
  typeName: string
): void => {
  const missing = required.filter(key => !(key in body));
  if (missing.length > 0) {
    throw new APIError(
      `Missing required fields in ${typeName}: ${missing.join(', ')}`,
      400
    );
  }
};

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export const createErrorResponse = (
  message: string,
  details?: any
) => ({
  error: message,
  details,
  timestamp: new Date().toISOString()
});

// Helper for type-safe error responses
export const throwAPIError = (
  message: string,
  statusCode: number = 500,
  details?: any
): never => {
  throw new APIError(message, statusCode, details);
};
