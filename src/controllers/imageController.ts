
import multer from 'multer';
import { User } from '../models/User';
import { CloudinaryService } from '../services/cloudinary';

const cloudinaryService = new CloudinaryService();

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
  limits: { fileSize: 5 * 1024 * 1024 },
});

export class ImageController {
  
  async uploadProfileImage(req: any, res: any) {
    try {
      console.log('=== Upload Request ===');
      console.log('File:', req.file ? 'Present' : 'Missing');
      console.log('Content-Type:', req.headers['content-type']);
      
      if (!req.file) {
        console.log('ERROR: No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // ✅ Upload without userId (now optional)
      const result = await cloudinaryService.uploadImage(
        req.file.buffer,
        undefined,  // No userId
        'game_images'
      );

      console.log('Upload successful!');
      console.log('Cloudinary URL:', result.url);

      res.status(200).json({
        message: 'Image uploaded successfully',
        imageUrl: result.url,
        publicId: result.publicId,
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteProfileImage(req: any, res: any) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required for deletion' });
      }

      const userId = req.user.userId;
      const user = await User.findById(userId);
      
      if (!user?.profileImagePublicId) {
        return res.status(404).json({ error: 'No profile image found' });
      }

      await cloudinaryService.deleteImage(user.profileImagePublicId);

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
      console.log('=== Multiple Upload Request ===');
      console.log('Files:', req.files ? req.files.length : 0);
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const fileBuffers = (req.files as Express.Multer.File[]).map(
        (file) => file.buffer
      );

      // ✅ Upload without userId
      const results = await cloudinaryService.uploadMultipleImages(
        fileBuffers,
        undefined,  // No userId
        'game_images'
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