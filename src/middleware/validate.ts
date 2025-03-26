import { Request, Response, NextFunction, RequestHandler } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate = (schema: AnyZodObject): RequestHandler => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Invalid request data",
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
}; 

export const inlineValidate = async (schema: AnyZodObject, body: any, req: Request) => {
  try {
    req.body = await schema.parseAsync(body);
    return {valid: true};
  } catch (error) {
    return {valid: false, error};
  }
}