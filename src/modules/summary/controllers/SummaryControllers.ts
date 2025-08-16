import { summarizeHandler } from '../handlers/SummaryHandlers';
import { Request, Response, NextFunction } from 'express';

export async function postSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const imageUrls = req.body?.image_urls || req.body?.imageUrls || [];
    const result = await summarizeHandler({ files: req.files as any || [], imageUrls });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
