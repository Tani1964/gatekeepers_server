import multer from 'multer';
import { User } from '../models/User';
import { CloudinaryService } from '../services/cloudinary';

const cloudinaryService = new CloudinaryService();

// Configure multer to use memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export class ImageController {
  
  async uploadProfileImage(req: any, res: any) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user.userId;
      
      // Get user's current image public ID
      const user = await User.findById(userId);
      const oldPublicId = user?.profileImagePublicId;

      // Upload and replace image using service
      const result = await cloudinaryService.replaceImage(
        req.file.buffer,
        userId,
        oldPublicId,
        'user_profiles'
      );

      // Update user record
      await User.findByIdAndUpdate(userId, {
        profileImage: result.url,
        profileImagePublicId: result.publicId,
      });

      res.status(200).json({
        message: 'Profile image uploaded successfully',
        imageUrl: result.url,
        publicId: result.publicId,
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }

  async deleteProfileImage(req: any, res: any) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      
      if (!user?.profileImagePublicId) {
        return res.status(404).json({ error: 'No profile image found' });
      }

      // Delete from Cloudinary using service
      await cloudinaryService.deleteImage(user.profileImagePublicId);

      // Update user record
      await User.findByIdAndUpdate(userId, {
        profileImage: '',
        profileImagePublicId: '',
      });

      res.json({ message: 'Profile image deleted successfully' });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }

  async uploadMultiple(req: any, res: any) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const userId = req.user.userId;
      const fileBuffers = (req.files as Express.Multer.File[]).map(
        (file) => file.buffer
      );

      // Upload multiple images using service
      const results = await cloudinaryService.uploadMultipleImages(
        fileBuffers,
        userId,
        'user_gallery'
      );

      res.status(200).json({
        message: 'Images uploaded successfully',
        images: results,
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
}
