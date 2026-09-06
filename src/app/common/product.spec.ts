import { Product } from './product';

describe('Product', () => {
  it('should create an instance', () => {
    const product = new Product(
      'SKU-123',
      'Test Product',
      'A sample product description',
      19.99,
      'https://example.com/image.jpg',
      true,
      10,
      new Date(),
      new Date()
    );

    expect(product).toBeTruthy();
  });
});
