

// controllers/auth/authController.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { OTPService } from '../../services/otpService';
import { createWallet } from '../wallet/index';

const otpService = new OTPService();

export class AuthController {
  // Increase eyes for a user
  async increaseEyes(req: any, res: any) {
    try {
      const { userId, amount } = req.body;
      if (!userId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'userId and positive amount are required' });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.eyes += amount;
      await user.save();
      res.status(200).json({ success: true, message: `Increased eyes by ${amount}`, eyes: user.eyes });
    } catch (error) {
      console.error('Increase eyes error:', error);
      res.status(500).json({ error: 'Failed to increase eyes' });
    }
  }
  
  // Reduce eyes for a user
  async reduceEyes(req: any, res: any) {
    try {
      const { userId, amount } = req.body;
      if (!userId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'userId and positive amount are required' });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.eyes = Math.max(0, user.eyes - amount);
      await user.save();
      res.status(200).json({ success: true, message: `Reduced eyes by ${amount}`, eyes: user.eyes });
    } catch (error) {
      console.error('Reduce eyes error:', error);
      res.status(500).json({ error: 'Failed to reduce eyes' });
    }
  }
  
 async register(req: any, res: any) {
  try {
    const { email, name, age, password, phoneNumber, referral } = req.body;

    // Log incoming data
    console.log('Registration attempt:', { email, name, age, phoneNumber, referral });

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Handle referral code if provided
    let referrer = null;
    if (referral) {
      referrer = await User.findOne({ referralCode: referral });
      if (!referrer) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
    }

    console.log('Referrer found:', referrer ? referrer.email : 'None');

    // Generate unique referral code for new user
    const generateReferralCode = () => {
      return `${name.substring(0, 3).toUpperCase()}${Date.now().toString(36)}`.substring(0, 10);
    };

    const newUser = new User({
      email,
      name,
      age,
      phoneNumber,
      profileImage: 'null',
      passwordHash: await bcrypt.hash(password, 10),
      referralCode: generateReferralCode(),
    });

    console.log('User object created:', newUser);

    // Save the new user first
    await newUser.save();

    // If there's a referrer, add the new user to their referrals
    if (referrer) {
      if (!referrer.referrals) {
        referrer.referrals = [];
      }
      if (newUser._id) {
        referrer.referrals.push(newUser._id.toString());
        referrer.eyes += 3
      }
      await referrer.save();

      // Optional: Award bonus eyes to referrer
      // referrer.eyes += 10; // Example: 10 eyes bonus per referral
      // await referrer.save();

      console.log(`User ${newUser.email} registered with referral code from ${referrer.email}`);
    }

    // Create wallet for new user
    await createWallet(newUser, "");

    console.log('User saved successfully:', newUser);

    res.status(201).json({ 
      message: 'User registered successfully',
      referralCode: newUser.referralCode,
    });
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
      console.log("Login initiated")
      
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
  async initiateForgotPassword(req: any, res: any) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account exists with this email, a password reset OTP has been sent',
      });
    }

    // Create OTP for password reset
    await otpService.createOTP(email, 'password-reset');

    console.log(`Password reset OTP sent to: ${email}`);

    res.json({
      message: 'Password reset OTP has been sent to your email',
      nextStep: 'verify-reset-otp',
      email: email,
    });

  } catch (error) {
    console.error('Forgot password initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate password reset' });
  }
}

async verifyResetOTP(req: any, res: any) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Verify the OTP
    const otpResult = await otpService.verifyOTP(email, otp, 'password-reset');

    if (!otpResult.success) {
      return res.status(401).json({ error: otpResult.message });
    }

    // Generate a temporary token for password reset (valid for 15 minutes)
    const resetToken = jwt.sign(
      { email, purpose: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'OTP verified successfully',
      resetToken,
      nextStep: 'reset-password',
    });

  } catch (error) {
    console.error('Reset OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
}

async resetPassword(req: any, res: any) {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET!);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({ error: 'Invalid reset token' });
    }

    // Find user and update password
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password and update
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`Password reset successful for: ${user.email}`);

    res.json({
      message: 'Password has been reset successfully',
      nextStep: 'login',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}
}