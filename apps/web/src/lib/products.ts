export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
}

const productNames = [
  'Compact Camera',
  'Gaming Keyboard',
  'Vinyl Record Player',
  'Leather Messenger Bag',
  'Desk Lamp',
  'Wireless Earbuds',
];

const productCategories = [
  'photography',
  'electronics',
  'electronics',
  'fashion',
  'art',
  'electronics',
];

const products: Product[] = productNames.map((title, index) => ({
  id: `prod-${index + 1}`,
  title,
  description: `Local demo catalogue item: ${title}. High quality collectible item for enthusiasts.`,
  price: 29 + index * 24,
  category: productCategories[index],
  images: [`https://picsum.photos/seed/product-${index + 1}/600/600`],
}));

/**
 * Returns a cloned array of all demo products.
 */
export async function getAllProducts(): Promise<Product[]> {
  return products.map((product) => ({
    ...product,
    images: [...product.images],
  }));
}

/**
 * Finds a single product by ID.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const cleanId = String(id).trim();
  const product = products.find((p) => p.id === cleanId);

  if (!product) return null;

  return {
    ...product,
    images: [...product.images],
  };
}

/**
 * Filters products by category.
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const targetCategory = category.toLowerCase().trim();
  const filtered = products.filter((p) => p.category.toLowerCase() === targetCategory);

  return filtered.map((product) => ({
    ...product,
    images: [...product.images],
  }));
}

/**
 * Searches products by title or description matching query string.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = query.toLowerCase().trim();
  if (!term) return getAllProducts();

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
  );

  return filtered.map((product) => ({
    ...product,
    images: [...product.images],
  }));
}