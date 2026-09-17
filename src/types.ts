export type ProductId = 'sweatshirt' | 'tshirt' | 'longsleeve' | 'team';
export type ColorId = 'white' | 'black' | 'red';
export type PrintSide = 'front' | 'back';

export type Product = {
  id: ProductId;
  title: string;
  formTitle: string;
  price: string;
  specs: string;
  image: string;
  colors: ColorId[];
  hasCrest: boolean;
};

export type LightboxItem = {
  src: string;
  alt: string;
};

export type OrderPrefill = {
  productId: ProductId;
  color: ColorId;
  printSide: PrintSide | null;
};
