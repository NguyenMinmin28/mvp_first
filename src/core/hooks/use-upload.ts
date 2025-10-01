/**
 * Upload Hook
 * Provides easy-to-use upload functionality with loading states
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { uploadService, UploadOptions, UploadResult } from '@/core/services/upload.service';

export interface UseUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export interface UseUploadReturn {
  uploadFile: (file: File, options: UploadOptions) => Promise<UploadResult | null>;
  deleteFile: (publicId: string) => Promise<boolean>;
  isUploading: boolean;
  isDeleting: boolean;
}

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    onSuccess,
    onError,
    showToast = true
  } = options;

  const uploadFile = useCallback(async (file: File, uploadOptions: UploadOptions): Promise<UploadResult | null> => {
    if (!file) {
      const error = new Error('No file provided');
      onError?.(error);
      if (showToast) toast.error('No file provided');
      return null;
    }

    setIsUploading(true);
    
    try {
      const result = await uploadService.uploadFile(file, uploadOptions);
      
      onSuccess?.(result);
      if (showToast) toast.success('File uploaded successfully');
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      onError?.(err);
      if (showToast) toast.error(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess, onError, showToast]);

  const deleteFile = useCallback(async (publicId: string): Promise<boolean> => {
    if (!publicId) {
      const error = new Error('Public ID is required');
      onError?.(error);
      if (showToast) toast.error('Public ID is required');
      return false;
    }

    setIsDeleting(true);
    
    try {
      const success = await uploadService.deleteFile(publicId);
      
      if (success) {
        if (showToast) toast.success('File deleted successfully');
      } else {
        if (showToast) toast.error('Failed to delete file');
      }
      
      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Delete failed');
      onError?.(err);
      if (showToast) toast.error(err.message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [onError, showToast]);

  return {
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting
  };
}

/**
 * Specialized hooks for common upload scenarios
 */

export function useImageUpload(options: UseUploadOptions = {}) {
  const { uploadFile, isUploading } = useUpload(options);

  const uploadImage = useCallback(async (
    file: File, 
    folder: string = 'images',
    maxSize: number = 10
  ) => {
    return uploadFile(file, {
      folder,
      maxSize,
      resourceType: 'image',
      useFilename: true,
      uniqueFilename: true
    });
  }, [uploadFile]);

  return {
    uploadImage,
    isUploading
  };
}

export function useFileUpload(options: UseUploadOptions = {}) {
  const { uploadFile, isUploading } = useUpload(options);

  const uploadDocument = useCallback(async (
    file: File, 
    folder: string = 'documents',
    maxSize: number = 5
  ) => {
    return uploadFile(file, {
      folder,
      maxSize,
      resourceType: 'raw',
      useFilename: true,
      uniqueFilename: false
    });
  }, [uploadFile]);

  return {
    uploadDocument,
    isUploading
  };
}
