import { v2 as cloudinary } from 'cloudinary';

// ⚠️ IMPORTANT: This file should ONLY be imported in server-side code (API routes, server actions, server components)

/**
 * Parse CLOUDINARY_URL and configure Cloudinary SDK
 * Format: cloudinary://api_key:api_secret@cloud_name
 */
function configureCloudinary() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  if (!cloudinaryUrl) {
    throw new Error('CLOUDINARY_URL environment variable is not set');
  }
  
  // Parse CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  
  if (!match || match.length !== 4) {
    throw new Error('Invalid CLOUDINARY_URL format. Expected: cloudinary://api_key:api_secret@cloud_name');
  }
  
  const [, apiKey, apiSecret, cloudName] = match;
  
  // Configure Cloudinary with explicit values
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  return { cloudName, apiKey, apiSecret };
}

// Configure on module load
const cloudinaryConfig = configureCloudinary();

export { cloudinary };

/**
 * Generate signed upload signature for client-side uploads
 * This ensures only authenticated users can upload files
 * ⚠️ SERVER-SIDE ONLY - Use in API routes or server actions
 */
export function generateUploadSignature(params: {
  folder?: string;
  publicId?: string;
  timestamp: number;
}) {
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'transport_management_uploads';
  
  // Use the API key and secret from the configured Cloudinary instance
  const { apiKey, apiSecret } = cloudinaryConfig;
  
  // Generate signature using Cloudinary's utility function
  const signature = cloudinary.utils.api_sign_request(
    {
      ...params,
      upload_preset: uploadPreset,
    },
    apiSecret
  );
  
  // Return both signature and api_key (api_key is safe to expose to client)
  return {
    signature,
    apiKey,
  };
}

