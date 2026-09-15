// src/app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAllProducts, Product } from '@/lib/products';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID parameter is required' },
        { status: 400 }
      );
    }

    const products: Product[] = await getAllProducts();
    const product = products.find((p: Product) => p.id === id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: `Product with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: product },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('API Error in /api/products/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}