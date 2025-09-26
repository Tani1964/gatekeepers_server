












// src/db/connection.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/gatekeepers'
    );
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${mongoose.connection.name}`);

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('MongoDB error:', err);
});

export default connectDB;
















































































