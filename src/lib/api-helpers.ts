import { NextResponse } from "next/server";
import { ZodError, Schema } from "zod";
import logger from "@/lib/logger";

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: any): NextResponse<ApiErrorResponse> {
  logger.error("API route execution failed", error);

  const isApiError = error instanceof ApiError || (error && typeof error === "object" && (error.name === "ApiError" || "statusCode" in error));

  if (isApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "API_ERROR",
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  // Handle default server errors
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred on the server",
      },
    },
    { status: 500 }
  );
}

// Higher-order function wrapper for App Router API routes
export function withApiRoute<T = any>(
  handler: (req: Request, context: any) => Promise<NextResponse<T> | Response>
) {
  return async (req: Request, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Helper to validate incoming JSON body using Zod schema
export async function validateRequest<T>(req: Request, schema: Schema<T>): Promise<T> {
  let body: any;
  try {
    body = await req.json();
  } catch (error) {
    throw new ApiError(400, "BAD_REQUEST", "Invalid JSON payload or missing request body");
  }
  
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new ApiError(400, "VALIDATION_ERROR", "Zod validation parsing error");
  }
}

// Helper to validate search parameters or url dynamic params using Zod
export function validateParams<T>(params: any, schema: Schema<T>): T {
  try {
    return schema.parse(params);
  } catch (error) {
    throw new ApiError(400, "INVALID_PARAMETERS", "Invalid route parameters", error);
  }
}
