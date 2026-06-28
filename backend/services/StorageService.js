import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Cloud Storage Service
 * Abstracted storage layer supporting local, S3, GCS, and Azure
 */
export class StorageService {
  constructor() {
    this.provider = this.initializeProvider();
    this.uploadPath = config.upload?.path || './uploads';
    this.maxFileSize = config.upload?.maxSize || 10485760; // 10MB default
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Initialize storage provider based on configuration
   */
  initializeProvider() {
    // Cloudflare R2 (uses S3-compatible API with custom endpoint)
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
      return 'r2';
    }
    // Check for cloud provider configuration
    if (config.aws?.accessKeyId && config.aws?.secretAccessKey && config.aws?.bucketName) {
      return 's3';
    }
    if (config.googleCloud?.projectId && config.googleCloud?.keyFile) {
      return 'gcs';
    }
    if (config.azure?.connectionString && config.azure?.containerName) {
      return 'azure';
    }
    
    // Default to local storage
    return 'local';
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDirectory() {
    if (this.provider === 'local') {
      const dirs = [
        this.uploadPath,
        path.join(this.uploadPath, 'resumes'),
        path.join(this.uploadPath, 'images'),
        path.join(this.uploadPath, 'documents'),
        path.join(this.uploadPath, 'temp')
      ];
      
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      
      logger.info(`Local storage initialized at ${this.uploadPath}`);
    }
  }

  /**
   * Upload a file
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Original filename
   * @param {string} folder - Subfolder (resumes, images, documents, temp)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} File metadata
   */
  async uploadFile(buffer, filename, folder = 'documents', options = {}) {
    const fileId = uuidv4();
    const ext = path.extname(filename);
    const storedFilename = `${fileId}${ext}`;
    const mimeType = options.mimeType || this.detectMimeType(ext);
    const size = buffer.length;

    // Validate file size
    if (size > this.maxFileSize) {
      throw new Error(`File size ${size} exceeds maximum ${this.maxFileSize}`);
    }

    const fileKey = `${folder}/${storedFilename}`;
    
    try {
      let url;
      
      switch (this.provider) {
        case 'r2':
          url = await this.uploadToR2(buffer, fileKey, mimeType, options);
          break;
        case 's3':
          url = await this.uploadToS3(buffer, fileKey, mimeType, options);
          break;
        case 'gcs':
          url = await this.uploadToGCS(buffer, fileKey, mimeType, options);
          break;
        case 'azure':
          url = await this.uploadToAzure(buffer, fileKey, mimeType, options);
          break;
        default:
          url = await this.uploadToLocal(buffer, fileKey);
          break;
      }

      const metadata = {
        id: fileId,
        originalName: filename,
        storedName: storedFilename,
        key: fileKey,
        url,
        mimeType,
        size,
        folder,
        provider: this.provider,
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      };

      logger.info(`File uploaded: ${filename} -> ${fileKey}`);
      return metadata;
    } catch (error) {
      logger.error(`File upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload to local filesystem
   */
  async uploadToLocal(buffer, fileKey) {
    const filePath = path.join(this.uploadPath, fileKey);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, buffer);
    
    return `/uploads/${fileKey}`;
  }

  /**
   * Upload to Cloudflare R2 (S3-compatible)
   * R2 endpoint: https://<accountId>.r2.cloudflarestorage.com
   */
  async uploadToR2(buffer, fileKey, mimeType, options) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME;

    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: options.metadata,
    });

    await r2.send(command);

    if (options.public) {
      // Use custom domain if configured
      const customDomain = process.env.R2_PUBLIC_URL;
      if (customDomain) return `${customDomain}/${fileKey}`;
    }

    const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: fileKey });
    return await getSignedUrl(r2, getCommand, { expiresIn: 3600 });
  }

  /**
   * Download from Cloudflare R2
   */
  async downloadFromR2(fileKey) {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const accountId = process.env.R2_ACCOUNT_ID;

    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    const response = await r2.send(command);
    return this.streamToBuffer(response.Body);
  }

  /**
   * Delete from Cloudflare R2
   */
  async deleteFromR2(fileKey) {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const accountId = process.env.R2_ACCOUNT_ID;

    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    }));
  }

  /**
   * Upload to AWS S3
   */
  async uploadToS3(buffer, fileKey, mimeType, options) {
    // Lazy load AWS SDK
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3 = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });

    const command = new PutObjectCommand({
      Bucket: config.aws.bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      ACL: options.public ? 'public-read' : 'private',
      Metadata: options.metadata
    });

    await s3.send(command);
    
    if (options.public) {
      return `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;
    }
    
    // Return signed URL for private files (valid for 1 hour)
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const getCommand = new GetObjectCommand({ Bucket: config.aws.bucketName, Key: fileKey });
    return await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
  }

  /**
   * Upload to Google Cloud Storage
   */
  async uploadToGCS(buffer, fileKey, mimeType, options) {
    const { Storage } = await import('@google-cloud/storage');
    
    const storage = new Storage({
      projectId: config.googleCloud.projectId,
      keyFilename: config.googleCloud.keyFile
    });

    const bucket = storage.bucket(config.googleCloud.bucketName);
    const file = bucket.file(fileKey);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: options.metadata
      },
      public: options.public,
      predefinedAcl: options.public ? 'publicRead' : 'private'
    });

    if (options.public) {
      return `https://storage.googleapis.com/${config.googleCloud.bucketName}/${fileKey}`;
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600000 // 1 hour
    });

    return signedUrl;
  }

  /**
   * Upload to Azure Blob Storage
   */
  async uploadToAzure(buffer, fileKey, mimeType, options) {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azure.connectionString
    );

    const containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileKey);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
      metadata: options.metadata
    });

    if (options.public) {
      return blockBlobClient.url;
    }

    const { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = 
      await import('@azure/storage-blob');
    
    const sasOptions = {
      containerName: config.azure.containerName,
      blobName: fileKey,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn: new Date(Date.now() + 3600000)
    };

    const sharedKeyCredential = new StorageSharedKeyCredential(
      config.azure.accountName,
      config.azure.accountKey
    );

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    return `${blockBlobClient.url}?${sasToken}`;
  }

  /**
   * Download a file
   * @param {string} fileKey - Storage key
   * @returns {Promise<Buffer>} File buffer
   */
  async downloadFile(fileKey) {
    switch (this.provider) {
      case 'r2':
        return this.downloadFromR2(fileKey);
      case 's3':
        return this.downloadFromS3(fileKey);
      case 'gcs':
        return this.downloadFromGCS(fileKey);
      case 'azure':
        return this.downloadFromAzure(fileKey);
      default:
        return this.downloadFromLocal(fileKey);
    }
  }

  /**
   * Download from local filesystem
   */
  async downloadFromLocal(fileKey) {
    const filePath = path.join(this.uploadPath, fileKey);
    return fs.readFileSync(filePath);
  }

  /**
   * Download from S3
   */
  async downloadFromS3(fileKey) {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3 = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });

    const command = new GetObjectCommand({
      Bucket: config.aws.bucketName,
      Key: fileKey
    });

    const response = await s3.send(command);
    return this.streamToBuffer(response.Body);
  }

  /**
   * Download from GCS
   */
  async downloadFromGCS(fileKey) {
    const { Storage } = await import('@google-cloud/storage');
    
    const storage = new Storage({
      projectId: config.googleCloud.projectId,
      keyFilename: config.googleCloud.keyFile
    });

    const bucket = storage.bucket(config.googleCloud.bucketName);
    const file = bucket.file(fileKey);
    
    const [contents] = await file.download();
    return contents;
  }

  /**
   * Download from Azure
   */
  async downloadFromAzure(fileKey) {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azure.connectionString
    );

    const containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileKey);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    return this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
  }

  /**
   * Convert stream to buffer
   */
  async streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Delete a file
   * @param {string} fileKey - Storage key
   */
  async deleteFile(fileKey) {
    switch (this.provider) {
      case 'r2':
        return this.deleteFromR2(fileKey);
      case 's3':
        return this.deleteFromS3(fileKey);
      case 'gcs':
        return this.deleteFromGCS(fileKey);
      case 'azure':
        return this.deleteFromAzure(fileKey);
      default:
        return this.deleteFromLocal(fileKey);
    }
  }

  /**
   * Delete from local filesystem
   */
  async deleteFromLocal(fileKey) {
    const filePath = path.join(this.uploadPath, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Delete from S3
   */
  async deleteFromS3(fileKey) {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3 = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });

    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucketName,
      Key: fileKey
    });

    await s3.send(command);
  }

  /**
   * Delete from GCS
   */
  async deleteFromGCS(fileKey) {
    const { Storage } = await import('@google-cloud/storage');
    
    const storage = new Storage({
      projectId: config.googleCloud.projectId,
      keyFilename: config.googleCloud.keyFile
    });

    const bucket = storage.bucket(config.googleCloud.bucketName);
    await bucket.file(fileKey).delete();
  }

  /**
   * Delete from Azure
   */
  async deleteFromAzure(fileKey) {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azure.connectionString
    );

    const containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
    await containerClient.getBlockBlobClient(fileKey).delete();
  }

  /**
   * Detect MIME type from extension
   */
  detectMimeType(ext) {
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.json': 'application/json'
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    return {
      provider:    this.provider,
      uploadPath:  this.provider === 'local' ? this.uploadPath : null,
      maxFileSize: this.maxFileSize,
      configured: {
        local:  true,
        s3:     !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_BUCKET_NAME),
        r2:     !!(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME),
        gcs:    !!(process.env.GOOGLE_CLOUD_PROJECT_ID),
        azure:  !!(process.env.AZURE_STORAGE_CONNECTION_STRING),
      },
    };
  }
}

export default new StorageService();