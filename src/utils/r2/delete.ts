// utils/r2/delete.ts
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKET } from './config';

export interface DeleteResult {
    success: boolean;
    key?: string;
    error?: string;
}

/**
 * Delete a file from R2
 */
export const deleteFromR2 = async (key: string): Promise<DeleteResult> => {
    try {
        if (!key) {
            return { success: false, error: 'No key provided' };
        }
        
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        
        await r2.send(command);
        
        return {
            success: true,
            key: key,
        };
    } catch (error) {
        console.error('Delete failed:', error);
        return {
            success: false,
            key: key,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
};

/**
 * Delete multiple files from R2
 */
export const deleteMultipleFromR2 = async (keys: string[]): Promise<DeleteResult[]> => {
    const results = await Promise.all(keys.map(key => deleteFromR2(key)));
    return results;
};