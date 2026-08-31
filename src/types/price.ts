export type PriceItemType = 'material' | 'labor' | 'equipment';
export type ItemType = PriceItemType;

export interface PriceItem {
  id: string;
  userId: string;
  code: string;
  name: string;
  type: PriceItemType;
  category: string;
  unit: string;
  price: number;
  source: string;
  updatedAt: string;
}
