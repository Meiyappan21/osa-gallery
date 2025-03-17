import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { cookies } from 'next/headers';

// Initialize the S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',  // Added GIF support
  'model/gltf-binary',
  'model/vrm',
  'application/octet-stream',
  'application/x-vrm',
  'application/json' // Added JSON support for metadata
]);

// Helper function to determine content type based on file extension
const getContentType = (fileName: string, declaredType: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'vrm':
      return 'application/octet-stream';
    case 'gif':
      return 'image/gif';
    case 'json':
      return 'application/json';
    default:
      return declaredType;
  }
};

// Helper function to validate file type
const isValidFileType = (fileName: string, declaredType: string): boolean => {
  const contentType = getContentType(fileName, declaredType);
  
  // Always allow VRM files based on extension
  if (fileName.toLowerCase().endsWith('.vrm')) {
    return true;
  }
  
  return ALLOWED_FILE_TYPES.has(contentType);
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication using session cookie
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
    }

    if (!sessionData.userId || !['admin', 'creator'].includes(sessionData.role)) {
      return NextResponse.json({ error: 'Unauthorized - Insufficient permissions' }, { status: 403 });
    }

    // Get request body
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    // Validate file type
    if (!isValidFileType(fileName, fileType)) {
      console.log('Rejected file:', { fileName, fileType }); // Debug log
      return NextResponse.json({ 
        error: 'Invalid file type', 
        details: { fileName, fileType } 
      }, { status: 400 });
    }

    // Generate a unique key for the file
    const timestamp = Date.now();
    const uniqueFileName = `${sessionData.userId}/${timestamp}-${fileName}`;

    // Determine the proper content type
    const contentType = getContentType(fileName, fileType);

    // Create the PutObject command
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType,
    });

    // Generate a pre-signed URL
    const url = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 });

    // Generate the public URL
    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFileName}`;

    return NextResponse.json({ url, publicUrl });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}