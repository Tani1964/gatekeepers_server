// ========================================
// UPDATED CloudinaryService
// ========================================

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ✅ UPDATED: Made userId optional for game images
  async uploadImage(
    fileBuffer: Buffer,
    userId?: string,  // Now optional
    folder: string = 'user_profiles'
  ): Promise<{ url: string; publicId: string }> {
    try {
      // Generate public_id based on whether userId exists
      const publicId = userId 
        ? `user_${userId}_${Date.now()}`
        : `image_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: publicId,
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Image deleted: ${publicId}`);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  // ✅ UPDATED: Made userId optional
  async uploadMultipleImages(
    fileBuffers: Buffer[],
    userId?: string,
    folder: string = 'user_uploads'
  ): Promise<Array<{ url: string; publicId: string }>> {
    try {
      const uploadPromises = fileBuffers.map((buffer, index) => {
        const id = userId ? `${userId}_${index}` : undefined;
        return this.uploadImage(buffer, id, folder);
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw new Error('Failed to upload multiple images');
    }
  }

  async replaceImage(
    fileBuffer: Buffer,
    userId: string,
    oldPublicId?: string,
    folder: string = 'user_profiles'
  ): Promise<{ url: string; publicId: string }> {
    try {
      // Delete old image if exists
      if (oldPublicId) {
        await this.deleteImage(oldPublicId);
      }

      // Upload new image
      return await this.uploadImage(fileBuffer, userId, folder);
    } catch (error) {
      console.error('Replace image error:', error);
      throw new Error('Failed to replace image');
    }
  }
}

