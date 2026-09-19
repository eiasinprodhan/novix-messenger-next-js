import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

const AVAILABLE_GIFTS = [
  { id: 'gift_cake', name: 'Birthday Cake', icon: '🎂', starPrice: 15, tag: 'Popular', category: 'General' },
  { id: 'gift_bear', name: 'Teddy Bear', icon: '🧸', starPrice: 25, tag: 'Cute', category: 'General' },
  { id: 'gift_mystery', name: 'Mystery Box', icon: '🎁', starPrice: 50, tag: 'Surprise', category: 'Special' },
  { id: 'gift_rose', name: 'Rose Bouquet', icon: '🌹', starPrice: 20, tag: 'Romantic', category: 'General' },
  { id: 'gift_rocket', name: 'Space Rocket', icon: '🚀', starPrice: 100, tag: 'To the Moon', category: 'Luxury' },
  { id: 'gift_crown', name: 'Royal Crown', icon: '👑', starPrice: 250, tag: 'VIP', category: 'Luxury' },
  { id: 'gift_diamond', name: 'Diamond Gem', icon: '💎', starPrice: 500, tag: 'Precious', category: 'Luxury' },
  { id: 'gift_car', name: 'Sports Car', icon: '🏎️', starPrice: 1000, tag: 'Limited', category: 'Luxury' },
  { id: 'gift_champagne', name: 'Champagne', icon: '🍾', starPrice: 30, tag: 'Celebration', category: 'General' },
  { id: 'gift_heart', name: 'Flaming Heart', icon: '💖', starPrice: 10, tag: 'Love', category: 'General' },
  { id: 'gift_star', name: 'Golden Star', icon: '🌟', starPrice: 75, tag: 'Sparkle', category: 'Special' },
  { id: 'gift_trophy', name: 'Champion Trophy', icon: '🏆', starPrice: 150, tag: 'Winner', category: 'Special' },
];

// GET /api/gifts
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    let userGifts: any[] = [];
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId).select('giftsReceived');
      if (targetUser && targetUser.giftsReceived) {
        userGifts = targetUser.giftsReceived;
      }
    } else {
      const payload = getUserFromRequest(request);
      if (payload?.userId) {
        const currentUser = await User.findById(payload.userId).select('giftsReceived');
        if (currentUser && currentUser.giftsReceived) {
          userGifts = currentUser.giftsReceived;
        }
      }
    }

    return NextResponse.json({
      success: true,
      catalog: AVAILABLE_GIFTS,
      gifts: userGifts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch gifts' }, { status: 500 });
  }
}

// POST /api/gifts (Send a Gift)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recipientId, giftId, isAnonymous, message: giftComment } = body;

    if (!recipientId || !giftId) {
      return NextResponse.json({ error: 'Recipient and Gift ID are required' }, { status: 400 });
    }

    const gift = AVAILABLE_GIFTS.find((g) => g.id === giftId);
    if (!gift) {
      return NextResponse.json({ error: 'Invalid gift selected' }, { status: 400 });
    }

    const sender = await User.findById(payload.userId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const senderBalance = typeof sender.starsBalance === 'number' ? sender.starsBalance : 250;
    if (senderBalance < gift.starPrice) {
      return NextResponse.json(
        {
          error: `Insufficient Stars. You have ${senderBalance} ⭐ but need ${gift.starPrice} ⭐.`,
          required: gift.starPrice,
          current: senderBalance,
        },
        { status: 400 }
      );
    }

    // Deduct Stars from sender
    sender.starsBalance = senderBalance - gift.starPrice;
    if (!sender.starTransactions) sender.starTransactions = [];
    sender.starTransactions.unshift({
      id: 'gift_send_' + Date.now(),
      type: 'gift_sent',
      amount: -gift.starPrice,
      title: `Sent ${gift.name} ${gift.icon}`,
      description: `Sent to ${recipient.name || recipient.username}${isAnonymous ? ' (Anonymous)' : ''}`,
      createdAt: new Date(),
    });
    await sender.save();

    // Add Gift to recipient
    const giftRecord = {
      id: 'g_' + Date.now(),
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      starPrice: gift.starPrice,
      senderId: isAnonymous ? '' : sender._id.toString(),
      senderName: isAnonymous ? 'Anonymous' : (sender.name || sender.username),
      senderAvatar: isAnonymous ? '' : (sender.avatar || ''),
      isAnonymous: !!isAnonymous,
      message: (giftComment || '').trim(),
      sentAt: new Date(),
      isPinned: true,
      convertedToStars: false,
    };

    if (!recipient.giftsReceived) recipient.giftsReceived = [];
    recipient.giftsReceived.unshift(giftRecord);
    await recipient.save();

    // Optionally create a notification chat message
    try {
      await Message.create({
        sender: sender._id,
        receiver: recipient._id,
        content: `${gift.icon} Sent you a gift: ${gift.name}!${giftComment ? ` "${giftComment}"` : ''}`,
        type: 'text',
        status: 'sent',
      });
    } catch (_) {
      // Non-blocking if Message model structure differs
    }

    return NextResponse.json({
      success: true,
      message: `Gift ${gift.name} sent successfully!`,
      newBalance: sender.starsBalance,
      gift: giftRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send gift' }, { status: 500 });
  }
}

// PATCH /api/gifts (Toggle Pin or Convert to Stars)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { giftRecordId, action } = body; // action: 'toggle_pin' | 'convert_to_stars'

    const user = await User.findById(payload.userId);
    if (!user || !user.giftsReceived) {
      return NextResponse.json({ error: 'User or gifts not found' }, { status: 404 });
    }

    const gift = user.giftsReceived.find((g: any) => g.id === giftRecordId);
    if (!gift) {
      return NextResponse.json({ error: 'Gift record not found' }, { status: 404 });
    }

    if (action === 'toggle_pin') {
      gift.isPinned = !gift.isPinned;
      await user.save();
      return NextResponse.json({ success: true, isPinned: gift.isPinned });
    }

    if (action === 'convert_to_stars') {
      if (gift.convertedToStars) {
        return NextResponse.json({ error: 'Gift already converted to Stars' }, { status: 400 });
      }

      // Convert 80% of star price to user's stars balance
      const refundStars = Math.max(1, Math.floor(gift.starPrice * 0.8));
      gift.convertedToStars = true;
      gift.isPinned = false;
      user.starsBalance = (user.starsBalance || 0) + refundStars;

      if (!user.starTransactions) user.starTransactions = [];
      user.starTransactions.unshift({
        id: 'convert_' + Date.now(),
        type: 'gift_received',
        amount: refundStars,
        title: `Converted ${gift.giftName} ${gift.giftIcon}`,
        description: `Received ${refundStars} Stars from converting received gift`,
        createdAt: new Date(),
      });

      await user.save();
      return NextResponse.json({
        success: true,
        message: `Converted gift to ${refundStars} Stars!`,
        starsBalance: user.starsBalance,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update gift' }, { status: 500 });
  }
}
