import fs from 'fs';
import path from 'path';

export class CleanupService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public createJobDir(jobId: string): string {
    const jobDir = path.join(this.tempDir, jobId);
    fs.mkdirSync(jobDir, { recursive: true });
    return jobDir;
  }

  private activeJobs: Set<string> = new Set();

  public registerJob(jobId: string): void {
    this.activeJobs.add(jobId);
  }

  public unregisterJob(jobId: string): void {
    this.activeJobs.delete(jobId);
  }

  public async cleanupJob(jobId: string): Promise<void> {
    const jobDir = path.join(this.tempDir, jobId);
    if (!fs.existsSync(jobDir) || this.activeJobs.has(jobId)) {
      return;
    }

    try {
      // Wait for a short delay to ensure all file operations are complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Double check that the job is still not active
      if (this.activeJobs.has(jobId)) {
        return;
      }

      // Attempt cleanup with retries
      let retries = 3;
      while (retries > 0) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
          console.log(`Successfully cleaned up job directory: ${jobDir}`);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          console.warn(`Failed to cleanup directory, retrying in 5 seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup job directory:', {
        jobDir,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  public async cleanupAllJobs(): Promise<void> {
    if (!fs.existsSync(this.tempDir)) {
      return;
    }

    try {
      // Wait for any in-progress operations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const jobs = fs.readdirSync(this.tempDir);
      for (const jobId of jobs) {
        await this.cleanupJob(jobId);
      }

      console.log('Successfully cleaned up all job directories');
    } catch (error) {
      console.error('Failed to cleanup all jobs:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Cleanup jobs older than the specified hours
  public cleanupOldJobs(hours: number = 24): void {
    if (!fs.existsSync(this.tempDir)) return;

    const now = Date.now();
    const jobDirs = fs.readdirSync(this.tempDir);

    jobDirs.forEach(jobDir => {
      const jobPath = path.join(this.tempDir, jobDir);
      const stats = fs.statSync(jobPath);
      const ageInHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);

      if (ageInHours > hours) {
        fs.rmSync(jobPath, { recursive: true, force: true });
      }
    });
  }
}

export const cleanup = new CleanupService();

// Set up cleanup interval (every 6 hours)
setInterval(() => {
  cleanup.cleanupOldJobs(24);
}, 6 * 60 * 60 * 1000);

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Cleaning up temporary files...');
  try {
    await cleanup.cleanupAllJobs();
  } catch (error) {
    console.error('Failed to cleanup on SIGINT:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Cleaning up temporary files...');
  try {
    await cleanup.cleanupAllJobs();
  } catch (error) {
    console.error('Failed to cleanup on SIGTERM:', error);
  }
  process.exit(0);
});
