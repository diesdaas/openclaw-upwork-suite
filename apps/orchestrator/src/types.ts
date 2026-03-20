export interface JobDetail {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budgetUsd?: number;
  hourlyMin?: number;
  hourlyMax?: number;
  url?: string;
  postedAt?: string;
}
