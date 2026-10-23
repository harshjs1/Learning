import { v2 as cloudinary } from 'cloudinary';
import { access, unlink } from 'node:fs/promises';

export const uploadOnCloudinary = async (localFilePath, folder) => {
  if (!localFilePath) {
    throw new Error('A local file path is required for upload');
  }

  try {
    await access(localFilePath);
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new Error('Cloudinary credentials are not configured');
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      ...(folder ? { folder } : {}),
    });
    return result;
  } finally {
    try {
      await unlink(localFilePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
};
