import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sellerId = searchParams.get('sellerId');
    const currency = searchParams.get('currency');
    const isSold = searchParams.get('isSold');
    const sort = searchParams.get('sort') || 'newest';

    const filter: Record<string, any> = {
      status: { $ne: 'archived' },
    };

    const condition = searchParams.get('condition');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (category && category !== 'all' && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (condition && condition !== 'all' && condition !== 'All') {
      filter.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (sellerId) {
      filter.seller = sellerId;
    }

    if (currency && currency !== 'all') {
      filter.currency = currency.toUpperCase();
    }

    if (isSold === 'true') {
      filter.isSold = true;
    } else if (isSold === 'false') {
      filter.isSold = false;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'popular') {
      sortOptions = { views: -1 };
    }

    const products = await Product.find(filter)
      .populate('seller', 'name username avatar isOnline')
      .sort(sortOptions)
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Marketplace GET products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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
      title,
      description = '',
      price,
      currency = 'USD',
      category,
      condition = 'Brand New',
      images = [],
      location = '',
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product title is required' },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Valid product price is required' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Product category is required' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      seller: payload.userId,
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      currency: (currency || 'USD').toUpperCase().trim(),
      category: category.trim(),
      condition: condition.trim(),
      images: Array.isArray(images) ? images : [],
      location: location ? location.trim() : '',
      isSold: false,
      views: 0,
      status: 'active',
    });

    const populated = await product.populate(
      'seller',
      'name username avatar isOnline'
    );

    return NextResponse.json(
      { success: true, product: populated },
      { status: 201 }
    );
  } catch (error) {
    console.error('Marketplace POST product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
