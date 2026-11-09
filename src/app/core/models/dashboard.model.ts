export interface DashboardChartPoint {
  key: string;
  label: string;
  value: number;
}

export interface DashboardMonthlyActivity {
  period: string;
  projects: number;
  reviews: number;
  messages: number;
}

export interface DashboardStats {
  projects: number;
  publishedProjects: number;
  draftProjects: number;
  featuredProjects: number;
  technologies: number;
  skills: number;
  skillCategories: number;
  services: number;
  timelineItems: number;
  experiences: number;
  educations: number;
  reviews: number;
  approvedReviews: number;
  pendingReviews: number;
  rejectedReviews: number;
  messages: number;
  unreadMessages: number;
  readMessages: number;
  cvs: number;
  averageRating: number;
  publicationRate: number;
  approvalRate: number;
  unreadMessageRate: number;
}

export interface DashboardCharts {
  projectsByStatus: DashboardChartPoint[];
  projectsByTechnology: DashboardChartPoint[];
  skillsByCategory: DashboardChartPoint[];
  reviewsByRating: DashboardChartPoint[];
  reviewsByStatus: DashboardChartPoint[];
  messagesByStatus: DashboardChartPoint[];
  timelineByType: DashboardChartPoint[];
  activity: DashboardMonthlyActivity[];
}

export type DashboardActivityType =
  | 'PROJECT'
  | 'REVIEW'
  | 'MESSAGE';

export interface DashboardRecentActivityItem {
  type: DashboardActivityType;
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
}

export interface DashboardRecentActivity {
  items: DashboardRecentActivityItem[];
}

export interface DashboardOverview {
  stats: DashboardStats;
  charts: DashboardCharts;
  recentActivity: DashboardRecentActivityItem[];
  generatedAt: string;
}
