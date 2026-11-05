import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? response.getHeader('x-request-id');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message: string | string[] = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppError) {
      status = exception.getStatus();
      const body = exception.getResponse() as {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
      code = body.code;
      message = body.message;
      details = body.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = HttpStatus[status] ?? 'HTTP_ERROR';
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string | string[]) ?? message;
        code = (obj.code as string) ?? (obj.error as string) ?? code;
        details = obj.details as Record<string, unknown> | undefined;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      // Surface Prisma / driver hints so empty-DB and schema issues are diagnosable
      const maybeCode = (exception as Error & { code?: unknown }).code;
      const prismaCode = typeof maybeCode === 'string' ? maybeCode : undefined;
      details = {
        name: exception.name,
        ...(prismaCode ? { prismaCode } : {}),
        hint: exception.message.slice(0, 300),
      };
      message = 'An unexpected error occurred';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: typeof message === 'string' ? code : undefined,
      code,
      details,
      requestId,
    });
  }
}
