export interface TechnologyRequest {
  name: string;
  image: string | null;
  position: number;
  color: string | null;
}

export interface Technology extends TechnologyRequest {
  id: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
