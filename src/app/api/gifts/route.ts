import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

const AVAILABLE_GIFTS = [
  // ── Regular Gifts ──
  { id: 'gift_heart', name: 'Heart with Ribbon', icon: '💖', starPrice: 15, tag: 'Love', category: 'General', isCollectible: false, isResale: false },
  { id: 'gift_bear', name: 'Teddy Bear', icon: '🧸', starPrice: 15, tag: 'Cute', category: 'General', isCollectible: false, isResale: false },
  { id: 'gift_box', name: 'Golden Gift Box', icon: '🎁', starPrice: 25, tag: 'Surprise', category: 'General', isCollectible: false, isResale: false },
  { id: 'gift_rose', name: 'Red Rose', icon: '🌹', starPrice: 25, tag: 'Romantic', category: 'General', isCollectible: false, isResale: false },
  { id: 'gift_cake', name: 'Birthday Cake', icon: '🎂', starPrice: 50, tag: 'Popular', category: 'General', isCollectible: false, isResale: false },
  { id: 'gift_bouquet', name: 'Tulip Bouquet', icon: '💐', starPrice: 50, tag: 'Flowers', category: 'General', isCollectible: false, isResale: false },
  { id: 'gift_rocket', name: 'Space Rocket', icon: '🚀', starPrice: 50, tag: 'To the Moon', category: 'Special', isCollectible: false, isResale: false },
  { id: 'gift_trophy', name: 'Golden Trophy', icon: '🏆', starPrice: 100, tag: 'Winner', category: 'Special', isCollectible: false, isResale: false },
  { id: 'gift_ring', name: 'Diamond Ring', icon: '💍', starPrice: 100, tag: 'Precious', category: 'Luxury', isCollectible: false, isResale: false },
  { id: 'gift_diamond', name: 'Blue Diamond', icon: '💎', starPrice: 100, tag: 'Precious', category: 'Luxury', isCollectible: false, isResale: false },
  { id: 'gift_champagne', name: 'Popping Champagne', icon: '🍾', starPrice: 50, tag: 'Celebration', category: 'General', isCollectible: false, isResale: false },

  // ── Collectibles (Resale Limited-Edition Gifts) ──
  { id: 'gift_torch', name: 'Liberty Torch', icon: '🗽', starPrice: 500, tag: 'Collectible', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_popcorn', name: 'Cinema Popcorn', icon: '🍿', starPrice: 490, tag: 'Snack', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_liberty', name: 'Chibi Liberty', icon: '🗽', starPrice: 588, tag: 'Statue', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_dog', name: 'Cool Dog', icon: '🐶', starPrice: 625, tag: 'Vibe', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_ramen', name: 'Hot Ramen', icon: '🍜', starPrice: 509, tag: 'Yum', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_lollipop', name: 'Swirl Lollipop', icon: '🍭', starPrice: 535, tag: 'Sweet', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_icecream', name: 'Chocolate Bar', icon: '🍦', starPrice: 540, tag: 'Treat', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_flamingo', name: 'Pink Flamingo', icon: '🦩', starPrice: 500, tag: 'Summer', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_backpack', name: 'Novix Backpack', icon: '🎒', starPrice: 595, tag: 'Gear', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_stocking', name: 'Holiday Stocking', icon: '🧦', starPrice: 490, tag: 'Holiday', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_snake_2025', name: '2025 Snake', icon: '🐍', starPrice: 465, tag: '2025', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_goldbag', name: 'Gold Coins Bag', icon: '💰', starPrice: 667, tag: 'Wealth', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_candycane', name: 'Candy Cane', icon: '🍬', starPrice: 500, tag: 'Festive', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_poop', name: 'Lucky Poop', icon: '💩', starPrice: 500, tag: 'Humor', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_cupcake_8', name: 'Spring Cupcake', icon: '🧁', starPrice: 495, tag: 'Bakery', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_clover', name: 'Lucky Clover', icon: '🍀', starPrice: 666, tag: 'Fortune', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_box_mystery', name: 'Surprise Box', icon: '📦', starPrice: 504, tag: 'Mystery', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_crescent', name: 'Golden Crescent', icon: '🌙', starPrice: 667, tag: 'Holy', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_cherrycake', name: 'Cherry Cake', icon: '🍰', starPrice: 650, tag: 'Dessert', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_socks', name: 'Cozy Socks', icon: '🧦', starPrice: 599, tag: 'Winter', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_gingerbread', name: 'Gingerbread Heart', icon: '🍪', starPrice: 652, tag: 'Cookie', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_bday', name: 'Birthday Sign', icon: '🎂', starPrice: 667, tag: 'Party', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_jester', name: 'Jester Hat', icon: '👑', starPrice: 550, tag: 'Fun', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_santa_snake', name: 'Santa Snake', icon: '🐍', starPrice: 538, tag: 'Winter', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_easter_bunny', name: 'Easter Bunny', icon: '🐰', starPrice: 667, tag: 'Spring', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_cigar', name: 'Grand Cigar', icon: '🚬', starPrice: 1571, tag: 'Boss', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_medal', name: 'Champion Medal', icon: '🥇', starPrice: 580, tag: 'First', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_sparkler', name: 'Sparkler Wand', icon: '🪄', starPrice: 600, tag: 'Magic', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_lightsaber', name: 'Laser Blade', icon: '🔦', starPrice: 711, tag: 'SciFi', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_witch_hat', name: 'Wizard Hat', icon: '🧙', starPrice: 857, tag: 'Mystic', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_money_bouquet', name: 'Cash Bouquet', icon: '💵', starPrice: 655, tag: 'Rich', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_spellbook', name: 'Magic Grimoire', icon: '📕', starPrice: 622, tag: 'Spells', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_keycap', name: 'Mechanical Keycap', icon: '⌨️', starPrice: 667, tag: 'Tech', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_mushroom', name: 'Mystic Mushroom', icon: '🍄', starPrice: 667, tag: 'Glow', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_ufc', name: 'Fighter Pack', icon: '🥊', starPrice: 1712, tag: 'UFC', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_pot_gold', name: 'Pot of Gold', icon: '🍯', starPrice: 590, tag: 'Luck', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_easter_egg', name: 'Golden Egg', icon: '🥚', starPrice: 577, tag: 'Easter', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_sakura', name: 'Cherry Blossom', icon: '🌸', starPrice: 1133, tag: 'Japan', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_wreath', name: 'Holiday Wreath', icon: '🎄', starPrice: 500, tag: 'Holiday', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_journal', name: 'Vintage Journal', icon: '📓', starPrice: 610, tag: 'Writer', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_cauldron', name: 'Magic Cauldron', icon: '🧪', starPrice: 625, tag: 'Potion', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_clown_box', name: 'Surprise Clown', icon: '🤡', starPrice: 579, tag: 'Party', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_bowtie', name: 'Silk Bowtie', icon: '👔', starPrice: 660, tag: 'Formal', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_bunny_cupcake', name: 'Bunny Cupcake', icon: '🧁', starPrice: 857, tag: 'Cute', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_strawberries', name: 'Choco Berries', icon: '🍓', starPrice: 942, tag: 'Luxury', category: 'Collectibles', isCollectible: true, isResale: true },
  { id: 'gift_candle', name: 'Mystic Candle', icon: '🕯️', starPrice: 667, tag: 'Glow', category: 'Collectibles', isCollectible: true, isResale: true },
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

// POST /api/gifts (Send or Buy a Gift)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recipientId, giftId, isAnonymous, message: giftComment, gift: clientGift } = body;

    const effectiveRecipientId = (recipientId && recipientId !== 'self') ? recipientId : payload.userId;
    const isSelf = effectiveRecipientId === payload.userId;

    const gift = AVAILABLE_GIFTS.find((g) => g.id === giftId) || clientGift;
    if (!gift) {
      return NextResponse.json({ error: 'Invalid gift selected' }, { status: 400 });
    }

    const sender = await User.findById(payload.userId);
    const recipient = isSelf ? sender : await User.findById(effectiveRecipientId);

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

    const txTitle = isSelf ? `Purchased ${gift.name} ${gift.icon}` : `Sent ${gift.name} ${gift.icon}`;
    const txDesc = isSelf
      ? `Added to profile showcase`
      : `Sent to ${recipient.name || recipient.username}${isAnonymous ? ' (Anonymous)' : ''}`;

    sender.starTransactions.unshift({
      id: 'gift_send_' + Date.now(),
      type: isSelf ? 'purchase' : 'gift_sent',
      amount: -gift.starPrice,
      title: txTitle,
      description: txDesc,
      createdAt: new Date(),
    });

    // Add Gift Record to recipient (or sender if self)
    const giftRecord = {
      id: 'g_' + Date.now(),
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      starPrice: gift.starPrice,
      senderId: isSelf ? sender._id.toString() : (isAnonymous ? '' : sender._id.toString()),
      senderName: isSelf ? 'You' : (isAnonymous ? 'Anonymous' : (sender.name || sender.username)),
      senderAvatar: isSelf ? (sender.avatar || '') : (isAnonymous ? '' : (sender.avatar || '')),
      isAnonymous: !isSelf && !!isAnonymous,
      message: (giftComment || '').trim(),
      sentAt: new Date(),
      isPinned: true,
      convertedToStars: false,
    };

    if (isSelf) {
      if (!sender.giftsReceived) sender.giftsReceived = [];
      sender.giftsReceived.unshift(giftRecord);
      await sender.save();
    } else {
      await sender.save();
      if (!recipient.giftsReceived) recipient.giftsReceived = [];
      recipient.giftsReceived.unshift(giftRecord);
      await recipient.save();

      try {
        await Message.create({
          sender: sender._id,
          receiver: recipient._id,
          content: `${gift.icon} Sent you a gift: ${gift.name}!${giftComment ? ` "${giftComment}"` : ''}`,
          type: 'text',
          status: 'sent',
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      message: isSelf ? `Successfully bought ${gift.name}!` : `Gift ${gift.name} sent successfully!`,
      newBalance: sender.starsBalance,
      gift: giftRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process gift' }, { status: 500 });
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
