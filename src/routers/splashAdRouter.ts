import express, { Request, Response } from 'express';
import SplashAd from '../models/SplashAd';
import { CloudinaryService } from '../services/cloudinary';
import multer from 'multer';

const router = express.Router();
const cloudinaryService = new CloudinaryService();
const upload = multer({ storage: multer.memoryStorage() });

// GET current splash ad
router.get('/splash-ad', async (req: Request, res: Response) => {
  try {
    let splashAd = await SplashAd.findOne({ isActive: true });
    
    // If no splash ad exists, create a default one
    if (!splashAd) {
      splashAd = await SplashAd.create({
        imageUrl: '',
        imagePublicId: '',
        isActive: true
      });
    }
    
    res.json({ 
      success: true, 
      splashAd: {
        imageUrl: splashAd.imageUrl,
        isActive: splashAd.isActive
      }
    });
  } catch (error) {
    console.error('Get splash ad error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch splash ad' 
    });
  }
});

// UPDATE splash ad (admin only - client should verify auth)
router.put('/splash-ad', upload.single('image'), async (req: Request, res: Response) => {
  try {
    let splashAd = await SplashAd.findOne({ isActive: true });
    
    if (!splashAd) {
      splashAd = await SplashAd.create({
        imageUrl: '',
        imagePublicId: '',
        isActive: true
      });
    }

    // If a new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (splashAd.imagePublicId) {
        try {
          await cloudinaryService.deleteImage(splashAd.imagePublicId);
        } catch (error) {
          console.error('Error deleting old splash ad image:', error);
        }
      }

      // Upload new image
      const { url, publicId } = await cloudinaryService.uploadImage(
        req.file.buffer,
        undefined,
        'splash_ads'
      );

      splashAd.imageUrl = url;
      splashAd.imagePublicId = publicId;
    }

    await splashAd.save();

    res.json({ 
      success: true, 
      splashAd: {
        imageUrl: splashAd.imageUrl,
        isActive: splashAd.isActive
      }
    });
  } catch (error) {
    console.error('Update splash ad error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update splash ad' 
    });
  }
});

export default router;
