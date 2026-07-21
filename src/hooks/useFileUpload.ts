// hooks/useFileUpload.ts
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UploadResult {
  url: string;
  key: string;
}

interface UploadResponse {
  success: boolean;
  result?: UploadResult;
  error?: string;
}

interface UploadOptions {
  folder?: string;
  silent?: boolean;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const uploadFile = useCallback(
    async (
      file: File,
      options?: UploadOptions,
    ): Promise<UploadResult | null> => {
      const silent = options?.silent || false;

      // Set uploading state immediately
      setIsUploading(true);
      setUploadingFiles([file.name]);
      setUploadProgress(0);

      return new Promise((resolve) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.folder) {
          formData.append('folder', options.folder);
        }

        const xhr = new XMLHttpRequest();

        let simulationInterval: ReturnType<typeof setInterval> | null =
          setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 75) {
                if (simulationInterval) {
                  clearInterval(simulationInterval);
                  simulationInterval = null;
                }
                return prev;
              }
              return prev + 4;
            });
          }, 120);

        xhr.upload.addEventListener('progress', (event) => {
          if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
          }
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });

        const cleanup = (delay = 600) => {
          if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
          }
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadingFiles([]);
          }, delay);
        };

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setUploadProgress(100);
              cleanup();
              resolve({ url: data.url, key: data.key });
            } catch {
              if (!silent) toast.error('Invalid server response');
              cleanup(0);
              resolve(null);
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              if (!silent) toast.error(error.error || 'Upload failed');
            } catch {
              if (!silent) toast.error('Upload failed');
            }
            cleanup(0);
            resolve(null);
          }
        });

        xhr.addEventListener('error', () => {
          if (!silent) toast.error('Network error — upload failed');
          cleanup(0);
          resolve(null);
        });

        xhr.addEventListener('abort', () => {
          cleanup(0);
          resolve(null);
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
    },
    [],
  );

  const uploadMultipleFiles = useCallback(
    async (
      files: File[],
      options?: UploadOptions,
    ): Promise<UploadResponse[]> => {
      if (files.length === 0) return [];
      const silent = options?.silent || false;

      setIsUploading(true);
      setUploadingFiles(files.map((f) => f.name));
      setUploadProgress(0);

      try {
        const uploadPromises = files.map((file) =>
          uploadFile(file, { ...options, silent: true }),
        );
        const results = await Promise.all(uploadPromises);

        const responses: UploadResponse[] = results.map((result) => ({
          success: !!result,
          result: result || undefined,
          error: result ? undefined : 'Upload failed',
        }));

        const failureCount = responses.filter((r) => !r.success).length;
        const successCount = responses.filter((r) => r.success).length;

        if (!silent) {
          if (failureCount > 0 && successCount > 0) {
            toast.error(`${failureCount} of ${files.length} uploads failed`);
          } else if (failureCount === files.length) {
            toast.error('All uploads failed');
          }
        }

        setUploadProgress(100);
        setUploadingFiles([]);
        return responses;
      } catch (error) {
        console.error('Batch upload error:', error);
        if (!silent) toast.error('Upload failed');
        return files.map(() => ({
          success: false,
          error: 'Upload failed',
        }));
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFiles([]);
      }
    },
    [uploadFile],
  );

  const deleteFile = useCallback(
    async (key: string, silent?: boolean): Promise<boolean> => {
      setIsDeleting(true);
      try {
        const encodedKey = encodeURIComponent(key);
        const res = await fetch(`/api/upload?key=${encodedKey}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Delete failed');
        }

        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Delete failed';
        if (!silent) toast.error(message);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    isUploading,
    isDeleting,
    uploadProgress,
    uploadingFiles,
  };
};
