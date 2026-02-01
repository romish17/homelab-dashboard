export interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconUrl?: string; // If null, use default favicon logic
  createdAt: number;
}

export interface Category {
  id: string;
  title: string;
  links: LinkItem[];
}

export interface UserState {
  isAuthenticated: boolean;
}

export type ViewMode = 'list' | 'grid';
