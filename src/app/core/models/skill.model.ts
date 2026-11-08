export interface SkillCategoryRequest {
  name: string;
  position: number;
  color: string | null;
  image: string | null;
}

export interface SkillCategory extends SkillCategoryRequest {
  id: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRequest {
  categoryId: string;
  name: string;
  score: number;
  position: number;
  color: string | null;
  technologyId: string | null;
}

export interface Skill extends SkillRequest {
  id: string;
  categoryName: string;
  technologyName: string | null;
  technologyImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillCategoryPublic {
  id: string;
  name: string;
  position: number;
  color: string | null;
  image: string | null;
  imageUrl: string | null;
  skills: Skill[];
}
