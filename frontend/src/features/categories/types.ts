export interface Category {
  id: number;
  name: string;
  description: string | null;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
}
