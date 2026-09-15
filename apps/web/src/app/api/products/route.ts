// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getAllProducts, Product } from '@/lib/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filter Parameters
    const category = searchParams.get('category')?.trim();
    const search = searchParams.get('search')?.trim().toLowerCase();

    // Price Parameters with NaN protection
    const rawMinPrice = searchParams.get('minPrice');
    const rawMaxPrice = searchParams.get('maxPrice');
    const minPrice = rawMinPrice && !isNaN(Number(rawMinPrice)) ? Number(rawMinPrice) : null;
    const maxPrice = rawMaxPrice && !isNaN(Number(rawMaxPrice)) ? Number(rawMaxPrice) : null;

    // Pagination Parameters
    const rawLimit = Number(searchParams.get('limit'));
    const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const cursor = searchParams.get('cursor')?.trim();

    let products: Product[] = await getAllProducts();

    // 1. Filter by Category
    if (category && category !== 'all') {
      products = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 2. Filter by Search Query
    if (search) {
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    // 3. Filter by Price Range
    if (minPrice !== null) {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== null) {
      products = products.filter((p) => p.price <= maxPrice);
    }

    // 4. Determine Cursor Offset
    let startIndex = 0;
    if (cursor) {
      try {
        const decodedCursorId = Buffer.from(cursor, 'base64').toString('utf-8');
        const foundIndex = products.findIndex((p) => p.id === decodedCursorId);
        if (foundIndex !== -1) {
          startIndex = foundIndex + 1;
        }
      } catch {
        // Fallback to offset 0 if invalid base64 string provided
        startIndex = 0;
      }
    }

    // 5. Slice Paginated Items & Generate Next Cursor
    const paginatedProducts = products.slice(startIndex, startIndex + limit);
    const lastItem = paginatedProducts[paginatedProducts.length - 1];

    const nextCursor =
      lastItem && startIndex + limit < products.length
        ? Buffer.from(lastItem.id).toString('base64')
        : null;

    return NextResponse.json(
      {
        success: true,
        data: paginatedProducts,
        pagination: {
          limit,
          nextCursor,
          hasMore: Boolean(nextCursor),
          totalMatching: products.length,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('API Error in /api/products:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve products',
      },
      { status: 500 }
    );
  }
}