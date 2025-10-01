/**
 * Centralized Upload Service
 * Abstracts upload functionality to make it easy to switch providers
 */

export interface UploadOptions {
  folder: string;
  maxSize: number; // in MB
  resourceType: 'image' | 'raw';
  publicId?: string;
  useFilename?: boolean;
  uniqueFilename?: boolean;
}

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  originalFilename?: string;
}

export interface SignOptions {
  folder: string;
  resourceType: 'image' | 'raw';
  publicId?: string;
  useFilename?: boolean;
  uniqueFilename?: boolean;
}

export interface SignResult {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  publicId?: string;
  useFilename?: boolean;
  uniqueFilename?: boolean;
}

export interface UploadProvider {
  upload(file: File, options: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<boolean>;
  getSignedUrl?(options: SignOptions): Promise<SignResult>;
}

/**
 * Centralized Upload Service
 * Handles all upload operations with provider abstraction
 */
export class UploadService {
  private static instance: UploadService;
  private provider: UploadProvider;

  private constructor(provider: UploadProvider) {
    this.provider = provider;
  }

  public static getInstance(provider?: UploadProvider): UploadService {
    if (!UploadService.instance) {
      if (!provider) {
        throw new Error('Upload provider must be provided for first initialization');
      }
      UploadService.instance = new UploadService(provider);
    }
    return UploadService.instance;
  }

  public static setProvider(provider: UploadProvider): void {
    UploadService.instance = new UploadService(provider);
  }

  /**
   * Upload a file with the specified options
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > options.maxSize * 1024 * 1024) {
      throw new Error(`File must be ≤ ${options.maxSize}MB`);
    }

    if (options.resourceType === 'image' && !file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    return this.provider.upload(file, options);
  }

  /**
   * Delete a file by public ID
   */
  async deleteFile(publicId: string): Promise<boolean> {
    if (!publicId) {
      throw new Error('Public ID is required');
    }
    return this.provider.delete(publicId);
  }

  /**
   * Get signed URL for upload (if supported by provider)
   */
  async getSignedUrl(options: SignOptions): Promise<SignResult> {
    if (!this.provider.getSignedUrl) {
      throw new Error('Provider does not support signed URLs');
    }
    return this.provider.getSignedUrl(options);
  }
}

/**
 * Cloudinary Provider Implementation
 */
export class CloudinaryProvider implements UploadProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private uploadPreset?: string;

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  }

  async upload(file: File, options: UploadOptions): Promise<UploadResult> {
    try {
      // Try signed upload first
      const signResult = await this.getSignedUrl({
        folder: options.folder,
        resourceType: options.resourceType,
        publicId: options.publicId,
        useFilename: options.useFilename,
        uniqueFilename: options.uniqueFilename
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signResult.apiKey);
      formData.append('timestamp', String(signResult.timestamp));
      formData.append('folder', signResult.folder);
      formData.append('signature', signResult.signature);
      
      if (signResult.publicId) formData.append('public_id', signResult.publicId);
      if (signResult.useFilename !== undefined) formData.append('use_filename', String(signResult.useFilename));
      if (signResult.uniqueFilename !== undefined) formData.append('unique_filename', String(signResult.uniqueFilename));

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signResult.cloudName}/${options.resourceType}/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result?.error?.message || 'Upload failed');
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        originalFilename: result.original_filename
      };
    } catch (error) {
      // Fallback to unsigned upload
      if (!this.uploadPreset) {
        throw new Error('Cloudinary not configured for unsigned uploads');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/${options.resourceType}/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result?.error?.message || 'Upload failed');
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        originalFilename: result.original_filename
      };
    }
  }

  async delete(publicId: string): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
      const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/resources/image/upload`;
      const params = new URLSearchParams();
      params.append('public_ids[]', publicId);

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getSignedUrl(options: SignOptions): Promise<SignResult> {
    const response = await fetch('/api/uploads/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    return response.json();
  }
}

/**
 * Default provider factory
 */
export function createDefaultProvider(): UploadProvider {
  return new CloudinaryProvider();
}

/**
 * Initialize upload service with default provider
 */
export function initializeUploadService(): UploadService {
  const provider = createDefaultProvider();
  return UploadService.getInstance(provider);
}

/**
 * Upload service instance
 */
export const uploadService = initializeUploadService();
