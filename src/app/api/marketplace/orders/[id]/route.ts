import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id)
      .populate('product')
      .populate('buyer', 'name username avatar isOnline')
      .populate('seller', 'name username avatar isOnline')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (
      order.buyer._id.toString() !== payload.userId &&
      order.seller._id.toString() !== payload.userId &&
      payload.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Marketplace GET order details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only buyer or seller can update (seller can complete/cancel, buyer can cancel if pending)
    if (
      order.buyer.toString() !== payload.userId &&
      order.seller.toString() !== payload.userId &&
      payload.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (body.status && ['pending', 'completed', 'cancelled'].includes(body.status)) {
      order.status = body.status;
    }

    await order.save();

    const updated = await Order.findById(id)
      .populate('product')
      .populate('buyer', 'name username avatar isOnline')
      .populate('seller', 'name username avatar isOnline')
      .lean();

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Marketplace PUT order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
