import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';
import { invalidateFriendsCache } from '@/lib/redis';

// Normalize a phone number to only digits
function normalizeDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

// Check if two phone strings match (exact digits or one ends with the other's national number)
function phonesMatch(phone1: string, phone2: string): boolean {
  const d1 = normalizeDigits(phone1);
  const d2 = normalizeDigits(phone2);
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;

  // Compare trailing 8 to 10 digits to match local format (e.g. 01712... vs +8801712...)
  const minLen = Math.min(d1.length, d2.length);
  const checkLen = Math.min(minLen, 9);
  if (checkLen >= 7) {
    const sub1 = d1.slice(-checkLen);
    const sub2 = d2.slice(-checkLen);
    if (sub1 === sub2) return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawContacts: Array<{ name?: string; phone: string }> = Array.isArray(body.contacts)
      ? body.contacts
      : [];
    const rawPhoneNumbers: string[] = Array.isArray(body.phoneNumbers)
      ? body.phoneNumbers
      : [];
    const autoAddAsFriends = body.autoAddAsFriends !== false; // default true

    // Consolidate into a map of phone -> name
    const contactMap = new Map<string, string>();
    for (const c of rawContacts) {
      if (c && c.phone) {
        contactMap.set(c.phone.trim(), c.name?.trim() || '');
      }
    }
    for (const p of rawPhoneNumbers) {
      if (p && !contactMap.has(p.trim())) {
        contactMap.set(p.trim(), '');
      }
    }

    // Find all active users with a phone number (excluding self & admin)
    const registeredUsers = await User.find({
      _id: { $ne: payload.userId },
      role: { $ne: 'admin' },
      phone: { $exists: true, $ne: '' },
    }).select('_id name username avatar phone isOnline lastSeen role country');

    const matchedFriends: any[] = [];
    const matchedPhones = new Set<string>();

    for (const user of registeredUsers) {
      if (!user.phone) continue;

      let matchedContactName = '';
      let matchedSubmissionPhone = '';

      for (const [submittedPhone, contactName] of contactMap.entries()) {
        if (phonesMatch(user.phone, submittedPhone)) {
          matchedContactName = contactName || user.name;
          matchedSubmissionPhone = submittedPhone;
          matchedPhones.add(submittedPhone);
          break;
        }
      }

      if (matchedSubmissionPhone) {
        // Matched! Check or create friendship
        const existing = await Friendship.findOne({
          $or: [
            { requester: payload.userId, recipient: user._id },
            { requester: user._id, recipient: payload.userId },
          ],
        });

        let isFriend = false;
        if (existing) {
          if (existing.status === 'accepted') {
            isFriend = true;
          } else if (autoAddAsFriends && (existing.status === 'pending' || existing.status === 'rejected')) {
            existing.status = 'accepted';
            await existing.save();
            isFriend = true;
            await invalidateFriendsCache(payload.userId);
            await invalidateFriendsCache(user._id.toString());
          }
        } else if (autoAddAsFriends) {
          // Automatically establish friendship
          await Friendship.create({
            requester: payload.userId,
            recipient: user._id,
            status: 'accepted',
          });
          isFriend = true;
          await invalidateFriendsCache(payload.userId);
          await invalidateFriendsCache(user._id.toString());
        }

        matchedFriends.push({
          _id: user._id.toString(),
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          phone: user.phone,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          isFriend,
          contactName: matchedContactName,
        });
      }
    }

    // Identify unmatched contacts
    const unmatchedContacts: Array<{ name: string; phone: string; isFriend: boolean }> = [];
    for (const [phone, name] of contactMap.entries()) {
      if (!matchedPhones.has(phone)) {
        unmatchedContacts.push({
          name: name || phone,
          phone,
          isFriend: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalSubmitted: contactMap.size,
      matchedCount: matchedFriends.length,
      matchedFriends,
      unmatchedContacts,
    });
  } catch (error) {
    console.error('sync-contacts POST error:', error);
    return NextResponse.json({ error: 'Failed to sync contacts' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await invalidateFriendsCache(payload.userId);
    return NextResponse.json({
      success: true,
      message: 'Synced contacts cache cleared successfully',
    });
  } catch (error) {
    console.error('sync-contacts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete synced contacts' }, { status: 500 });
  }
}
