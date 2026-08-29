export interface MediaAdminItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MediaPlaylistItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string;
  sortOrder: number;
  isActive: boolean;
}
