import type { Request, Response } from "express";
import { handleZodError } from "@/utils/zodError";
import {
  idParamsSchema,
  paginationSchema,
  batchOperationSchema,
} from "../validators/CrudValidator";
import { CrudHandler } from "../handlers/CrudHandler";

export interface ICrudController {
  create(_req: Request, _res: Response): Promise<void>;
  list(_req: Request, _res: Response): Promise<void>;
  getById(_req: Request, _res: Response): Promise<void>;
  update(_req: Request, _res: Response): Promise<void>;
  delete(_req: Request, _res: Response): Promise<void>;
  batchDelete(_req: Request, _res: Response): Promise<void>;
  search(_req: Request, _res: Response): Promise<void>;
  count(_req: Request, _res: Response): Promise<void>;
}

export const createCrudController = <T, CreateData, UpdateData>(
  handler: CrudHandler<T, CreateData, UpdateData>,
  createSchema: any,
  updateSchema: any
): ICrudController => {
  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = createSchema.parse(req.body);
      const item = await handler.create(validatedData);
      res.status(201).json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, orderBy, order } = paginationSchema.parse(req.query);
      
      const options: any = {
        page,
        limit,
      };

      if (orderBy) {
        options.orderBy = { [orderBy]: order };
      }

      let result;
      if (search) {
        result = await handler.search(search, options);
      } else {
        result = await handler.list(options);
      }

      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const item = await handler.getById(id);
      res.json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const validatedData = updateSchema.parse(req.body);
      const item = await handler.update(id, validatedData);
      res.json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const delete_ = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const result = await handler.delete(id);
      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const batchDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ids } = batchOperationSchema.parse(req.body);
      const result = await handler.batchDelete(ids);
      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const search = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, orderBy, order } = paginationSchema.parse(req.query);
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: "Query parameter 'q' is required" });
        return;
      }

      const options: any = {
        page,
        limit,
      };

      if (orderBy) {
        options.orderBy = { [orderBy]: order };
      }

      const result = await handler.search(query, options);
      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  const count = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await handler.count();
      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  };

  return {
    create,
    list,
    getById,
    update,
    delete: delete_,
    batchDelete,
    search,
    count
  };
};
