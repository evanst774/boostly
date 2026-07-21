// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/utils/r2/upload';
import { deleteFromR2 } from '@/utils/r2/delete';
import { getCurrentUser } from '@/lib/auth/session.server';

/**
 * POST /api/upload
 * Generic file upload to R2 storage
 * Requires: Authenticated user (any role)
 *
 * This endpoint is used across the application:
 * - Bike images (inventory)
 * - Contract documents
 * - Profile pictures
 * - Other file uploads
 *
 * Permission validation for specific uploads is handled by the calling service.
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const folder = (formData.get('folder') as string) || 'general';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Single file upload (backward compatibility)
    if (files.length === 1) {
      const file = files[0];
      const result = await handleSingleFileUpload(file, folder, user.id);
      return NextResponse.json(result);
    }

    // Multiple files upload (parallel)
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await handleSingleFileUpload(file, folder, user.id);
          return result;
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
          };
        }
      }),
    );

    // Check if any uploads were successful
    const anySuccess = results.some((r) => r.success);
    const allSuccess = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      partialSuccess: anySuccess && !allSuccess,
      files: results,
      message: allSuccess
        ? `${results.length} file(s) uploaded successfully`
        : anySuccess
          ? `${results.filter((r) => r.success).length} file(s) uploaded, ${results.filter((r) => !r.success).length} failed`
          : 'All uploads failed',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

async function handleSingleFileUpload(
  file: File,
  folder: string,
  userId: string,
) {
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: `File too large (max 10MB): ${file.name}` };
  }

  // Validate file type
  const isValidType = validateFileType(file.type, folder);
  if (!isValidType) {
    return {
      success: false,
      error: `Invalid file type: ${file.name}. Allowed types: ${getAllowedTypesForFolder(folder)}`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadToR2({
    folder,
    originalName: file.name,
    buffer,
    contentType: file.type,
    userId,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    url: result.url,
    key: result.key,
    metadata: result.metadata,
  };
}

/**
 * DELETE /api/upload?key=file-key
 * Delete a file from R2 storage
 * Requires: Authenticated user (any role)
 *
 * Note: Consider adding ownership validation in the future
 * to ensure users can only delete their own uploaded files.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'No file key provided' },
        { status: 400 },
      );
    }

    // Optional: Add ownership check here
    // const isOwner = await verifyFileOwnership(key, user.id);
    // if (!isOwner) {
    //     return NextResponse.json({ error: 'Forbidden - You can only delete your own files' }, { status: 403 });
    // }

    const result = await deleteFromR2(key);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

/**
 * Validate file type based on the upload folder context
 */
function validateFileType(mimeType: string, folder: string): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allTypes = [...imageTypes, ...documentTypes];

  switch (folder) {
    case 'bikes':
    case 'profile-pictures':
    case 'avatars':
      // Images only for these folders
      return imageTypes.includes(mimeType);

    case 'contracts':
    case 'documents':
      // Documents and images for contracts
      return [...imageTypes, ...documentTypes].includes(mimeType);

    case 'general':
    default:
      // Allow all supported types
      return allTypes.includes(mimeType);
  }
}

/**
 * Get human-readable allowed types for error messages
 */
function getAllowedTypesForFolder(folder: string): string {
  switch (folder) {
    case 'bikes':
    case 'profile-pictures':
    case 'avatars':
      return 'JPEG, PNG, WebP, GIF';

    case 'contracts':
    case 'documents':
      return 'JPEG, PNG, WebP, GIF, PDF, DOC, DOCX';

    case 'general':
    default:
      return 'JPEG, PNG, WebP, GIF, PDF, DOC, DOCX';
  }
}
