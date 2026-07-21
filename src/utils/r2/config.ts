//src/utils/r2/config.ts
import { S3Client } from '@aws-sdk/client-s3';
import crypto from "crypto";

export const r2Config = {
    endpoint: process.env.R2_BUCKET_ENDPOINT!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
    accountId: process.env.R2_ACCOUNT_ID!,
    cdnDomain: process.env.R2_CDN_DOMAIN || process.env.R2_PUBLIC_URL,
};

export const r2 = new S3Client({
    endpoint: r2Config.endpoint,
    credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
    },
    region: 'auto',
});

export const BUCKET = r2Config.bucketName;

export const isR2Configured = (): boolean => {
    return !!(
        r2Config.endpoint &&
        r2Config.accessKeyId &&
        r2Config.secretAccessKey &&
        BUCKET
    );
};

export const getR2PublicUrl = (key: string): string => {
    const raw = (r2Config.cdnDomain || process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    // Normalize: ensure https:// is always present
    const baseUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return `${baseUrl}/${key}`;
};

export const generateFileKey = (folder: string, originalName: string): string => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');

    // Extract extension from the original name
    const extensionMatch = originalName.match(/\.([^.]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    // Strip extension before sanitizing to avoid doubling it
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const sanitizedName = nameWithoutExt
        .replace(/[^a-zA-Z0-9-]/g, '_')
        .toLowerCase()
        .slice(0, 50)
        // Trim any trailing underscores left by the replacement
        .replace(/_+$/, '');

    return extension
        ? `${folder}/${timestamp}-${randomString}-${sanitizedName}.${extension}`
        : `${folder}/${timestamp}-${randomString}-${sanitizedName}`;
};

export const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType === 'application/pdf') return 'documents';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'documents';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheets';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentations';
    return 'other';
};

export const testR2Connection = async (): Promise<boolean> => {
    if (!isR2Configured()) return false;
    
    try {
        const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
        const command = new ListBucketsCommand({});
        await r2.send(command);
        console.log('✅ R2 connection successful');
        return true;
    } catch (error) {
        console.error('❌ R2 connection failed:', error);
        return false;
    }
};