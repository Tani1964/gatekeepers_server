

// controllers/auth/authController.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { OTPService } from '../../services/otpService';
import { createWallet } from '../wallet/index';

const otpService = new OTPService();

export class AuthController {

  async register(req: any, res: any) {
    try {
      const { email, name, age, password, phoneNumber } = req.body;
      
      // Log incoming data
      console.log('Registration attempt:', { email, name, age, phoneNumber });

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const newUser = new User({
        email,
        name,
        age,
        phoneNumber,
        profileImage: 'null', // Default empty string
        passwordHash: await bcrypt.hash(password, 10),
      });
      
      console.log('User object created:', newUser);
      
      await newUser.save();
      await createWallet(newUser, "");
      console.log('User saved successfully:', newUser);

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error details:', error);
      res.status(500).json({ error: 'Registration failed', details: error });
    }
  }

  async initiateLogin(req: any, res: any) {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ email });
      if (!user || !await bcrypt.compare(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      await otpService.createOTP(email, 'login');
      
      res.json({
        message: 'OTP sent to your email',
        nextStep: 'verify-otp',
        email: email 
      });
      
    } catch (error) {
      console.error('Login initiation error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
  
  async completeLogin(req: any, res: any) {
    try {
      const { email, otp } = req.body;
      console.log(email, otp);
      
      const otpResult = await otpService.verifyOTP(email, otp, 'login');
      console.log(otpResult.success);
      
      if (!otpResult.success) {
        return res.status(401).json({ error: otpResult.message });
      }
      
      const user = await User.findOne({ email });
      console.log(user);
      
      const token = jwt.sign(
        { userId: user!._id, email: user!.email },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );
      console.log('Generated JWT:', token);

      res.json({
        message: 'Login successful',
        token,
        user: user
      });
      
    } catch (error) {
      console.error('Login completion error:', error);
      res.status(500).json({ error: 'OTP verification failed' });
    }
  }

  async verifyToken(req: any, res: any) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      const userData = await User.findById((decoded as any).userId);
      res.status(200).json({ success: true, user: decoded, userData });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  }

  async requestSensitiveOTP(req: any, res: any) {
    try {
      const email = req.user.email;
      
      await otpService.createOTP(email, 'sensitive-operation');
      
      res.json({
        message: 'OTP sent for verification',
        expiresIn: '10 minutes'
      });
      
    } catch (error) {
      console.error('Sensitive OTP request error:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }
  
  async verifySensitiveOTP(req: any, res: any) {
    try {
      const { otp } = req.body;
      const email = req.user.email;
      
      const otpResult = await otpService.verifyOTP(email, otp, 'sensitive-operation');
      if (!otpResult.success) {
        return res.status(401).json({ error: otpResult.message });
      }
      
      req.sensitiveOperationVerified = true;
      
      res.json({ message: 'OTP verified, proceed with operation' });
      
    } catch (error) {
      console.error('Sensitive OTP verification error:', error);
      res.status(500).json({ error: 'OTP verification failed' });
    }
  }
}