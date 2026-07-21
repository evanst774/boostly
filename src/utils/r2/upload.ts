// utils/r2/upload.ts
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKET, getR2PublicUrl, generateFileKey, getFileCategory } from './config';

export interface UploadOptions {
    folder: string;
    originalName: string;
    buffer: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
    userId?: string;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
    metadata?: {
        size: number;
        mimeType: string;
        category: string;
        originalName: string;
    };
}

/**
 * Upload a file to R2
 */
export const uploadToR2 = async (options: UploadOptions): Promise<UploadResult> => {
    try {
        const { folder, originalName, buffer, contentType, metadata, userId } = options;

        // Generate unique file key
        const key = generateFileKey(folder, originalName);
        const fileCategory = getFileCategory(contentType);

        // Prepare metadata
        const fileMetadata = {
            'original-name': encodeURIComponent(originalName),
            'content-type': contentType,
            'category': fileCategory,
            'size': buffer.length.toString(),
            'uploaded-at': new Date().toISOString(),
            ...(userId && { 'user-id': userId }),
            ...(metadata || {}),
        };

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            Metadata: fileMetadata,
        });

        await r2.send(command);

        return {
            success: true,
            url: getR2PublicUrl(key),
            key: key,
            metadata: {
                size: buffer.length,
                mimeType: contentType,
                category: fileCategory,
                originalName: originalName,
            },
        };
    } catch (error) {
        console.error('Upload failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
};

/**
 * Upload multiple files to R2
 */
export const uploadMultipleToR2 = async (
    files: Array<Omit<UploadOptions, 'folder'> & { folder?: string }>,
    defaultFolder: string = 'general'
): Promise<UploadResult[]> => {
    const results = await Promise.all(
        files.map(file => uploadToR2({
            ...file,
            folder: file.folder || defaultFolder,
        }))
    );
    return results;
};