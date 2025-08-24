// utils/pagination.ts
import { Request } from "express";

type PaginationParams = {
  skip: number;
  take: number;
  page: number;
};

export function getPaginationParams(req: Request): PaginationParams {
  const pageParam = Object.keys(req.query).find(key => key.toLowerCase().includes('page'));
  const limitParam = Object.keys(req.query).find(key => 
    key.toLowerCase().includes('limit') || key.toLowerCase().includes('per_page')
  );
  const page = pageParam ? parseInt(req.query[pageParam] as string) || 1 : 1;
  const limit = limitParam ? parseInt(req.query[limitParam] as string) || 20 : 20;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (page - 1) * take;

  return { skip, take, page };
}
