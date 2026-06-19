import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../models/User';

async function seed() {
  try {
    await connectDB();

    const demo = {
      email: 'demo@novix.dev',
      password: 'password123',
      name: 'Demo User',
      username: 'demo',
    };

    let user = await User.findOne({ email: demo.email.toLowerCase() });

    if (user) {
      console.log('✅ Demo user already exists:', demo.email);
      return;
    }

    user = await User.create({
      name: demo.name,
      username: demo.username,
      email: demo.email,
      password: demo.password,
      isVerified: true,
      isOnline: false,
    });

    console.log('✅ Demo user CREATED successfully!');
    console.log('Email:', demo.email);
    console.log('Password:', demo.password);
    console.log('Now you can login from Flutter app.');
  } catch (err: any) {
    console.error('❌ Seed error:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
