import { NextRequest } from 'next/server';
import User from '@/models/User';

export async function updateDeviceActivity(userId: string, req: NextRequest) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) return;

  const deviceName = req.headers.get('x-device-name') || 'Unknown Device';
  const deviceType = req.headers.get('x-device-type') || 'unknown';
  const os = req.headers.get('x-device-os') || '';
  const browser = req.headers.get('x-device-browser') || '';
  
  // Extract IP Address robustly
  const forwarded = req.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : (req.ip || '127.0.0.1');

  try {
    const user = await User.findById(userId);
    if (!user) return;

    if (!user.devices) {
      user.devices = [];
    }

    const existingDeviceIndex = user.devices.findIndex((d: any) => d.deviceId === deviceId);

    if (existingDeviceIndex > -1) {
      user.devices[existingDeviceIndex].lastActiveAt = new Date();
      user.devices[existingDeviceIndex].deviceName = deviceName;
      user.devices[existingDeviceIndex].deviceType = deviceType;
      user.devices[existingDeviceIndex].os = os;
      user.devices[existingDeviceIndex].browser = browser;
      user.devices[existingDeviceIndex].ipAddress = ipAddress;
    } else {
      user.devices.push({
        deviceId,
        deviceName,
        deviceType,
        os,
        browser,
        ipAddress,
        lastActiveAt: new Date(),
      });
    }

    await user.save();
  } catch (error) {
    console.error('Failed to update device activity:', error);
  }
}
