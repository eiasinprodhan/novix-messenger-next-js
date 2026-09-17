import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/security/identity
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select('identityVerified isVerified verificationSelfieUrl twoFactorEnabled passkeys devices email');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      identityVerified: !!user.identityVerified || !!user.isVerified,
      verificationSelfieUrl: user.verificationSelfieUrl || '',
      twoFactorEnabled: !!user.twoFactorEnabled,
      passkeys: user.passkeys || [],
      devicesCount: user.devices?.length || 1,
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch identity status' }, { status: 500 });
  }
}

// POST /api/security/identity
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, selfieData, passkeyName, twoFactorEnabled } = body;

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'submit_selfie' || action === 'confirm_identity') {
      user.identityVerified = true;
      user.isVerified = true;
      if (selfieData) {
        user.verificationSelfieUrl = selfieData;
      }
      await user.save();
      return NextResponse.json({
        success: true,
        message: 'Identity confirmed and verified successfully!',
        identityVerified: true,
        isVerified: true,
      });
    }

    if (action === 'toggle_2fa') {
      user.twoFactorEnabled = !!twoFactorEnabled;
      await user.save();
      return NextResponse.json({
        success: true,
        twoFactorEnabled: user.twoFactorEnabled,
      });
    }

    if (action === 'add_passkey') {
      if (!user.passkeys) user.passkeys = [];
      const newPasskey = {
        id: 'pk_' + Date.now(),
        name: passkeyName || 'Android Biometric Passkey',
        createdAt: new Date(),
      };
      user.passkeys.push(newPasskey);
      await user.save();
      return NextResponse.json({
        success: true,
        passkey: newPasskey,
        passkeys: user.passkeys,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update security identity' }, { status: 500 });
  }
}
