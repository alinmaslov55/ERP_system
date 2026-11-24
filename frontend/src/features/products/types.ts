export type ProductUnit = 'piece' | 'box' | 'kg' | 'liter' | 'meter';

export interface Product {
  id: number;
  category_id: number;
  sku: string;
  name: string;
  description: string | null;
  unit: ProductUnit | string;
  cost_price: string | number;
  selling_price: string | number;
  reorder_level: number;
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface ProductFormData {
  category_id: number;
  sku: string;
  name: string;
  description?: string;
  unit: ProductUnit;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  is_active: boolean;
}
