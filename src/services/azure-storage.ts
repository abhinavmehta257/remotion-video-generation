import { BlobServiceClient, ContainerSASPermissions } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { azureConfig } from '../utils/azure-config.js';
import { ConfigurationError } from '../types/index.js';

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    try {
      console.log('Initializing Azure Storage service...');
      const { connectionString, containerName } = azureConfig.storage;
      
      if (!connectionString) {
        throw new Error('Azure Storage connection string not found');
      }

      if (!containerName) {
        throw new Error('Azure Storage container name not found');
      }

      console.log('Storage configuration:', {
        containerName,
        connectionString: connectionString ? '***' : undefined
      });

      this.containerName = containerName;
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      console.log('Azure Storage service initialized successfully');
    } catch (error) {
      console.error('Azure Storage Service initialization error:', error);
      throw new ConfigurationError(`Failed to initialize Azure Storage service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async initializeContainer(): Promise<void> {
    console.log(`Initializing container: ${this.containerName}`);
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      console.log('Container client created, checking if container exists...');
      
      const exists = await containerClient.exists();
      console.log(`Container exists: ${exists}`);
      
      if (!exists) {
        console.log('Creating container...');
        const createResult = await containerClient.create({
          access: 'blob'
        });
        console.log('Container created:', createResult);
      }
    } catch (error) {
      console.error('Container initialization error:', error);
      throw new Error(`Failed to initialize container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadVideo(videoBuffer: Buffer, jobId: string): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobName = `${jobId}-${uuidv4()}.mp4`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(videoBuffer, videoBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'video/mp4',
          blobCacheControl: 'public, max-age=31536000'
        }
      });

      // Generate SAS URL that expires in N days
      const sasUrl = await this.generateSasUrl(blobName);
      return sasUrl;
    } catch (error) {
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteVideo(url: string): Promise<void> {
    try {
      const blobName = this.getBlobNameFromUrl(url);
      if (!blobName) {
        throw new Error('Invalid blob URL');
      }

      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error) {
      throw new Error(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateSasUrl(blobName: string): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + azureConfig.storage.retentionDays);

      const sasOptions = {
        permissions: ContainerSASPermissions.parse('r'),
        expiresOn: expiryDate
      };

      const sasUrl = await blockBlobClient.generateSasUrl(sasOptions);
      return sasUrl;
    } catch (error) {
      throw new Error(`Failed to generate SAS URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getBlobNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      return null;
    }
  }
}

export const azureStorage = new AzureStorageService();
