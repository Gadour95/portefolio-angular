export type ReviewStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface ReviewCreatePayload {
  fullName: string;
  jobTitle: string;
  rating: number;
  description: string;
}

export interface Review {
  id: string;
  fullName: string;
  jobTitle: string;
  rating: number;
  description: string;
  imagePath: string | null;
  imageUrl: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStatusRequest {
  status: ReviewStatus;
}

export interface AdminReviewQuery {
  page?: number;
  size?: number;
  status?: ReviewStatus;
  search?: string;
}
