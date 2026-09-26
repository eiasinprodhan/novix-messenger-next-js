import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('seller', 'name username avatar isOnline')
      .lean();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Marketplace GET product details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
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
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const sellerId = (product.seller as any)?._id
      ? (product.seller as any)._id.toString()
      : product.seller.toString();

    if (sellerId !== payload.userId.toString() && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      'title',
      'description',
      'price',
      'currency',
      'category',
      'condition',
      'images',
      'location',
      'isSold',
      'status',
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'price') {
          (product as any)[key] = Number(body[key]);
        } else if (key === 'currency') {
          (product as any)[key] = String(body[key]).toUpperCase().trim();
        } else {
          (product as any)[key] = body[key];
        }
      }
    }

    if (body.isSold === true) {
      product.status = 'sold';
    } else if (body.isSold === false && product.status === 'sold') {
      product.status = 'active';
    }

    await product.save();
    const updated = await product.populate(
      'seller',
      'name username avatar isOnline'
    );

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Marketplace PUT product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const sellerId = (product.seller as any)?._id
      ? (product.seller as any)._id.toString()
      : product.seller.toString();

    if (sellerId !== payload.userId.toString() && payload.role !== 'admin') {
      console.warn(`Marketplace DELETE Forbidden: product seller ${sellerId} !== user ${payload.userId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Marketplace DELETE product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
