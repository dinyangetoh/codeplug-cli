class ProductType {
  constructor(
    public name: string,
    public price: number,
  ) {}

  getName(): string {
    return this.name;
  }

  getPrice(): number {
    return this.price;
  }
}

const productType = new ProductType("Product", 100);

export default productType;
