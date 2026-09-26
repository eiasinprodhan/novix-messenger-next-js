import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'bought' | 'sold' | 'all'

    let filter: Record<string, any> = {};
    if (type === 'bought') {
      filter = { buyer: payload.userId };
    } else if (type === 'sold') {
      filter = { seller: payload.userId };
    } else {
      filter = {
        $or: [{ buyer: payload.userId }, { seller: payload.userId }],
      };
    }

    const orders = await Order.find(filter)
      .populate('product')
      .populate('buyer', 'name username avatar isOnline')
      .populate('seller', 'name username avatar isOnline')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Marketplace GET orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productId,
      quantity = 1,
      deliveryAddress,
      contactPhone,
      notes = '',
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length === 0) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    if (!contactPhone || typeof contactPhone !== 'string' || contactPhone.trim().length === 0) {
      return NextResponse.json(
        { error: 'Contact phone number is required' },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.seller.toString() === payload.userId) {
      return NextResponse.json(
        { error: 'You cannot purchase your own product' },
        { status: 400 }
      );
    }

    const q = Math.max(1, Number(quantity) || 1);
    const unitPrice = product.price;
    const totalPrice = Number((unitPrice * q).toFixed(2));

    const order = await Order.create({
      product: product._id,
      buyer: payload.userId,
      seller: product.seller,
      quantity: q,
      unitPrice,
      totalPrice,
      currency: product.currency || 'USD',
      deliveryAddress: deliveryAddress.trim(),
      contactPhone: contactPhone.trim(),
      notes: notes ? notes.trim() : '',
      status: 'pending',
    });

    const populatedOrder = await order.populate([
      { path: 'product' },
      { path: 'buyer', select: 'name username avatar isOnline' },
      { path: 'seller', select: 'name username avatar isOnline' },
    ]);

    // Send an order inquiry message directly into the chat
    try {
      const orderMessageText = `🛍️ Order Placed for "${product.title}"!\n• Qty: ${q}\n• Total: ${totalPrice} ${product.currency}\n• Delivery to: ${deliveryAddress.trim()}\n• Phone: ${contactPhone.trim()}${notes ? `\n• Notes: ${notes.trim()}` : ''}`;
      
      await Message.create({
        sender: payload.userId,
        receiver: product.seller,
        content: orderMessageText,
        type: 'text',
        status: 'sent',
      });
    } catch (msgErr) {
      console.warn('Could not post order message to chat:', msgErr);
    }

    return NextResponse.json(
      { success: true, order: populatedOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Marketplace POST order error:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}
