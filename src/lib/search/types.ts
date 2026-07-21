// src/lib/search/types.ts

export type SearchEntityType =
  | 'customer'
  | 'bike'
  | 'sale'
  | 'contract'
  | 'supplier'
  | 'model'
  | 'user'
  | 'page'
  | 'action';

export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  badge?: string;
  href: string;
  icon?: string;
}

export interface SearchGroupResult {
  type: SearchEntityType;
  label: string;
  items: SearchResultItem[];
}

export interface SearchApiResponse {
  query: string;
  groups: SearchGroupResult[];
}
