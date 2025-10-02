import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Game } from '../src/models/Game';
import { OTP } from '../src/models/OTP';
import { User } from '../src/models/User';
import { UserGameDetails } from '../src/models/UserGameDetails';
import { Wallet } from '../src/models/Wallet';

// Database connection
// const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gatekeepers?directConnection=true&serverSelectionTimeoutMS=2000&appName=gatekeepers';

const MONGODB_URI='mongodb+srv://admin:4yhs7Qvc9AZvoEdB@gatekeepers-proddb.yawvn9r.mongodb.net/?retryWrites=true&w=majority&appName=gatekeepers-prodDBv'

// Types for seed data
interface SeedUser {
  name: string;
  phoneNumber: string;
  email: string;
  role: 'user' | 'admin';
  eyes: number;
  age: number;
  isActive: boolean;
  passwordHash: string;
  referralCode: string;
  profileImage: string;
  referrals?: Array<{ id: string; createdAt: Date }>;
  tags: string[];
}

interface SeedGame {
  title: string;
  startTime: string;
  startDate: string;
  durationInMinutes: number;
  friends: string[];
  enemies: string[];
  players: mongoose.Types.ObjectId[];
  connectedUsers: number;
  price: number;
  createdBy: mongoose.Types.ObjectId | null;
}

interface SeedUserGameDetails {
  userId: mongoose.Types.ObjectId;
  games: mongoose.Types.ObjectId[];
  score: number;
  level: number;
  eyes: number;
  gamesPlayed: number;
  yearlyPosition: number;
  achievements: string[];
}

interface SeedWallet {
  userId: mongoose.Types.ObjectId;
  balance: number;
  transactions: Array<{
    amount: number;
    type: 'credit' | 'debit';
    date: Date;
  }>;
}

interface SeedOTP {
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  purpose: 'login' | 'registration' | 'password-reset' | 'sensitive-operation';
}

// Sample data with profile images
const sampleUsers: SeedUser[] = [
  {
    name: 'John Doe',
    phoneNumber: '+1234567890',
    email: 'ifegbesan6@gmail.com',
    role: 'user',
    eyes: 150,
    age: 28,
    isActive: true,
    passwordHash: '', // Will be set during seeding
    referralCode: 'JOHN2025',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    tags: ['gamer', 'competitive', 'strategy']
  },
  {
    name: 'Jane Smith',
    phoneNumber: '+0987654321',
    email: 'jane@example.com',
    role: 'user',
    eyes: 200,
    age: 25,
    isActive: true,
    passwordHash: '', // Will be set during seeding
    referralCode: 'JANE2025',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    tags: ['casual', 'social', 'puzzle']
  },
  {
    name: 'Admin User',
    phoneNumber: '+1122334455',
    email: 'admin@example.com',
    role: 'admin',
    eyes: 1000,
    age: 35,
    isActive: true,
    passwordHash: '', // Will be set during seeding
    referralCode: 'ADMIN2025',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    tags: ['admin', 'moderator']
  },
  {
    name: 'Mike Johnson',
    phoneNumber: '+5566778899',
    email: 'mike@example.com',
    role: 'user',
    eyes: 75,
    age: 32,
    isActive: true,
    passwordHash: '', // Will be set during seeding
    referralCode: 'MIKE2025',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    referrals: [
      { id: 'user_referral_1', createdAt: new Date('2025-01-15') },
      { id: 'user_referral_2', createdAt: new Date('2025-02-20') }
    ],
    tags: ['action', 'multiplayer']
  }
];

// Games with image URLs for friends and enemies
const sampleGames: SeedGame[] = [
  {
    title: 'Battle Royale Championship',
    startTime: '19:00',
    startDate: '2025-12-01',
    durationInMinutes: 45,
    friends: [
      // 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop', // Team Alpha emblem
      'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=300&h=300&fit=crop'  // Team Beta emblem
    ],
    enemies: [
      // 'https://images.unsplash.com/photo-1578928959919-c8b7e3c3b9e4?w=300&h=300&fit=crop', // Team Gamma emblem
      'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=300&h=300&fit=crop'  // Team Delta emblem
    ],
    players: [], // Will be populated with user IDs
    connectedUsers: 0,
    price: 25.00,
    createdBy: null // Will be set to admin user ID
  },
  {
    title: 'Strategy Masters Tournament',
    startTime: '14:30',
    startDate: '2025-12-05',
    durationInMinutes: 90,
    friends: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop&auto=format&q=80', // Guild Warriors
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop&auto=format&q=80'  // Guild Mages
    ],
    enemies: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&auto=format&q=80', // Guild Rogues
      'https://images.unsplash.com/photo-1578928959919-c8b7e3c3b9e4?w=300&h=300&fit=crop&auto=format&q=80'  // Guild Paladins
    ],
    players: [], // Will be populated with user IDs
    connectedUsers: 0,
    price: 15.50,
    createdBy: null // Will be set to admin user ID
  },
  {
    title: 'Quick Match Arena',
    startTime: '21:00',
    startDate: '2025-12-10',
    durationInMinutes: 30,
    friends: [
      'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=300&h=300&fit=crop&auto=format&q=80' // Casual Group
    ],
    enemies: [
      'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=300&h=300&fit=crop&auto=format&q=80' // Pro Players
    ],
    players: [], // Will be populated with user IDs
    connectedUsers: 0,
    price: 10.00,
    createdBy: null // Will be set to first user ID
  },
  {
    title: 'Legends Showdown',
    startTime: '17:45',
    startDate: '2025-12-15',
    durationInMinutes: 60,
    friends: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop&auto=format&q=80' // Legends United
    ],
    enemies: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&auto=format&q=80' // Shadow Clan
    ],
    players: [], // Will be populated with user IDs
    connectedUsers: 0,
    price: 20.00,
    createdBy: null // Will be set to admin user ID
  },
  {
    title: 'Holiday Cup Finals',
    startTime: '20:00',
    startDate: '2025-12-22',
    durationInMinutes: 120,
    friends: [
      'https://images.unsplash.com/photo-1578928959919-c8b7e3c3b9e4?w=300&h=300&fit=crop&auto=format&q=80', // Frost Wolves
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop&auto=format&q=80'  // Snow Guardians
    ],
    enemies: [
      'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=300&h=300&fit=crop&auto=format&q=80', // Ice Breakers
      'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=300&h=300&fit=crop&auto=format&q=80'  // Fire Storm
    ],
    players: [], // Will be populated with user IDs
    connectedUsers: 0,
    price: 30.00,
    createdBy: null // Will be set to admin user ID
  },
  {
    title: 'New Year Eve Clash',
    startTime: '23:30',
    startDate: '2025-12-31',
    durationInMinutes: 90,
    friends: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&auto=format&q=80' // Party Squad
    ],
    enemies: [
      'https://images.unsplash.com/photo-1578928959919-c8b7e3c3b9e4?w=300&h=300&fit=crop&auto=format&q=80' // Resolution Rivals
    ],
    players: [], // Will be populated with user IDs
    connectedUsers: 0,
    price: 50.00,
    createdBy: null // Will be set to admin user ID
  }
];

async function hashPassword(password: string): Promise<string> {
  const saltRounds: number = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function clearDatabase(): Promise<void> {
  try {
    await User.deleteMany({});
    await Game.deleteMany({});
    await UserGameDetails.deleteMany({});
    await Wallet.deleteMany({});
    await OTP.deleteMany({});
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedUsers(): Promise<any[]> {
  try {
    console.log('🔄 Starting to seed users...');
    
    // Hash passwords for all users
    for (const user of sampleUsers) {
      user.passwordHash = await hashPassword('password123'); // Default password
    }

    console.log('📝 About to insert users:', sampleUsers.length);
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Successfully inserted ${users.length} users with IDs:`, users.map(u => u._id));
    return users;
  } catch (error) {
    console.error('❌ Detailed error seeding users:', error);
    throw error;
  }
}

async function seedGames(users: any[]): Promise<any[]> {
  try {
    console.log('🔄 Starting to seed games...');
    
    // Assign createdBy for all games
    sampleGames[0].createdBy = users[2]._id; // Admin user
    sampleGames[1].createdBy = users[2]._id; // Admin user  
    sampleGames[2].createdBy = users[0]._id; // John Doe
    sampleGames[3].createdBy = users[2]._id; // Admin user
    sampleGames[4].createdBy = users[2]._id; // Admin user
    sampleGames[5].createdBy = users[2]._id; // Admin user

    // Add some players to games
    sampleGames[0].players = [users[0]._id, users[1]._id, users[3]._id];
    sampleGames[1].players = [users[1]._id, users[3]._id];
    sampleGames[2].players = [users[0]._id, users[1]._id];
    sampleGames[3].players = [users[3]._id];
    sampleGames[4].players = [users[0]._id, users[2]._id];
    sampleGames[5].players = [users[1]._id, users[2]._id, users[3]._id];

    // Set connected users dynamically
    sampleGames.forEach(game => {
      game.connectedUsers = game.players.length;
    });

    console.log('📝 About to insert games:', sampleGames.length);
    const games = await Game.insertMany(sampleGames);
    console.log(`✅ Successfully inserted ${games.length} games with IDs:`, games.map(g => g._id));
    return games;
  } catch (error) {
    console.error('❌ Detailed error seeding games:', error);
    throw error;
  }
}

async function seedUserGameDetails(users: any[], games: any[]): Promise<any[]> {
  try {
    console.log('🔄 Starting to seed user game details...');
    
    const userGameDetailsData: SeedUserGameDetails[] = [
      {
        userId: users[0]._id, // John Doe
        games: [games[0]._id, games[2]._id],
        score: 1250,
        level: 5,
        eyes: 150,
        gamesPlayed: 12,
        yearlyPosition: 15,
        achievements: ['First Victory', 'Speed Demon', 'Team Player']
      },
      {
        userId: users[1]._id, // Jane Smith
        games: [games[0]._id, games[1]._id, games[2]._id],
        score: 1580,
        level: 7,
        eyes: 200,
        gamesPlayed: 18,
        yearlyPosition: 8,
        achievements: ['Strategic Mind', 'Puzzle Master', 'Social Butterfly', 'Top 10']
      },
      {
        userId: users[2]._id, // Admin User
        games: [],
        score: 2500,
        level: 12,
        eyes: 1000,
        gamesPlayed: 45,
        yearlyPosition: 1,
        achievements: ['Game Master', 'Administrator', 'Legend', 'Unbeatable', 'Champion']
      },
      {
        userId: users[3]._id, // Mike Johnson
        games: [games[0]._id, games[1]._id],
        score: 950,
        level: 4,
        eyes: 75,
        gamesPlayed: 8,
        yearlyPosition: 25,
        achievements: ['Newcomer', 'Action Hero']
      }
    ];

    console.log('📝 About to insert user game details:', userGameDetailsData.length);
    const userGameDetails = await UserGameDetails.insertMany(userGameDetailsData);
    console.log(`✅ Successfully inserted ${userGameDetails.length} user game details with IDs:`, userGameDetails.map(ugd => ugd._id));
    return userGameDetails;
  } catch (error) {
    console.error('❌ Detailed error seeding user game details:', error);
    throw error;
  }
}

async function seedWallets(users: any[]): Promise<any[]> {
  try {
    console.log('🔄 Starting to seed wallets...');
    
    const walletData: SeedWallet[] = [
      {
        userId: users[0]._id, // John Doe
        balance: 125000.50,
        transactions: [
          { amount: 100.00, type: 'credit', date: new Date('2025-11-01') },
          { amount: -25.00, type: 'debit', date: new Date('2025-11-15') },
          { amount: 50.50, type: 'credit', date: new Date('2025-11-20') }
        ]
      },
      {
        userId: users[1]._id, // Jane Smith
        balance: 89.25,
        transactions: [
          { amount: 75.00, type: 'credit', date: new Date('2025-10-28') },
          { amount: -15.50, type: 'debit', date: new Date('2025-11-10') },
          { amount: 29.75, type: 'credit', date: new Date('2025-11-22') }
        ]
      },
      {
        userId: users[2]._id, // Admin User
        balance: 500.00,
        transactions: [
          { amount: 500.00, type: 'credit', date: new Date('2025-11-01') }
        ]
      },
      {
        userId: users[3]._id, // Mike Johnson
        balance: 45.00,
        transactions: [
          { amount: 50.00, type: 'credit', date: new Date('2025-11-18') },
          { amount: -5.00, type: 'debit', date: new Date('2025-11-25') }
        ]
      }
    ];

    console.log('📝 About to insert wallets:', walletData.length);
    const wallets = await Wallet.insertMany(walletData);
    console.log(`✅ Successfully inserted ${wallets.length} wallets with IDs:`, wallets.map(w => w._id));
    return wallets;
  } catch (error) {
    console.error('❌ Detailed error seeding wallets:', error);
    throw error;
  }
}

async function seedOTPs(): Promise<any[]> {
  try {
    console.log('🔄 Starting to seed OTPs...');
    
    const otpData: SeedOTP[] = [
      {
        email: 'newuser@example.com',
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        isUsed: false,
        purpose: 'registration'
      },
      {
        email: 'john@example.com',
        otp: '789012',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        isUsed: false,
        purpose: 'login'
      },
      {
        email: 'reset@example.com',
        otp: '345678',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        isUsed: false,
        purpose: 'password-reset'
      }
    ];

    console.log('📝 About to insert OTPs:', otpData.length);
    const otps = await OTP.insertMany(otpData);
    console.log(`✅ Successfully inserted ${otps.length} OTP records with IDs:`, otps.map(o => o._id));
    return otps;
  } catch (error) {
    console.error('❌ Detailed error seeding OTPs:', error);
    throw error;
  }
}

async function updateUserGameDetailsReferences(users: any[], userGameDetails: any[]): Promise<void> {
  try {
    console.log('🔄 Starting to update user-game details references...');
    
    // Update users with their game details references
    for (let i = 0; i < users.length; i++) {
      const updatedUser = await User.findByIdAndUpdate(
        users[i]._id,
        { userGameDetails: [userGameDetails[i]._id] },
        { new: true }
      );
      console.log(`📝 Updated user ${users[i].name} with game details reference:`, updatedUser?.userGameDetails);
    }
    console.log('✅ Updated user-game details references');
  } catch (error) {
    console.error('❌ Detailed error updating references:', error);
    throw error;
  }
}

async function verifySeeding(): Promise<void> {
  try {
    console.log('\n🔍 Verifying seeded data...');
    
    const userCount = await User.countDocuments();
    const gameCount = await Game.countDocuments();
    const userGameDetailsCount = await UserGameDetails.countDocuments();
    const walletCount = await Wallet.countDocuments();
    const otpCount = await OTP.countDocuments();
    
    console.log('📊 Database verification:');
    console.log(`   Users in DB: ${userCount}`);
    console.log(`   Games in DB: ${gameCount}`);
    console.log(`   UserGameDetails in DB: ${userGameDetailsCount}`);
    console.log(`   Wallets in DB: ${walletCount}`);
    console.log(`   OTPs in DB: ${otpCount}`);
    
    if (userCount === 0) {
      throw new Error('⚠️  No users were created in the database!');
    }
    
    // Sample a few records to verify they contain expected data
    const sampleUser = await User.findOne({});
    console.log('🧪 Sample user:', { 
      name: sampleUser?.name, 
      email: sampleUser?.email,
      profileImage: sampleUser?.profileImage 
    });
    
    const sampleGame = await Game.findOne({});
    console.log('🧪 Sample game:', { 
      title: sampleGame?.title,
      friendsCount: sampleGame?.friends?.length,
      enemiesCount: sampleGame?.enemies?.length
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function seedDatabase(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');
    console.log(`🌐 Using database: ${mongoose.connection.name}`);

    // Clear existing data
    await clearDatabase();

    // Seed data in order (maintaining relationships)
    console.log('\n📦 Starting database seeding...\n');

    const users = await seedUsers();
    const games = await seedGames(users);
    const userGameDetails = await seedUserGameDetails(users, games);
    const wallets = await seedWallets(users);
    const otps = await seedOTPs();

    // Update cross-references
    await updateUserGameDetailsReferences(users, userGameDetails);

    // Verify everything was created correctly
    await verifySeeding();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Games: ${games.length}`);
    console.log(`   User Game Details: ${userGameDetails.length}`);
    console.log(`   Wallets: ${wallets.length}`);
    console.log(`   OTP Records: ${otps.length}`);
    
    console.log('\n🔐 Default login credentials:');
    console.log('   john@example.com / password123');
    console.log('   jane@example.com / password123');
    console.log('   admin@example.com / password123');
    console.log('   mike@example.com / password123');

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Execute seeding
seedDatabase();