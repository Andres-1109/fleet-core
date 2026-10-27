import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainErrorType,
  DomainException,
} from '../exceptions/domain.exception';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}

const DOMAIN_ERROR_STATUS: Record<DomainErrorType, HttpStatus> = {
  [DomainErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [DomainErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [DomainErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorType.CONFLICT]: HttpStatus.CONFLICT,
};

/**
 * Global exception filter that turns every thrown error into the uniform
 * error envelope: { success, statusCode, message, path, timestamp }.
 *
 * - HttpException (including ValidationPipe errors) keeps its own status.
 * - DomainException is mapped to an HTTP status by its error type.
 * - Anything else is an unexpected failure: logged and returned as 500
 *   without leaking internal details to the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const { statusCode, message } = this.resolveError(exception);

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    message: string;
  } {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: this.extractHttpMessage(exception),
      };
    }

    if (exception instanceof DomainException) {
      return {
        statusCode: DOMAIN_ERROR_STATUS[exception.type],
        message: exception.message,
      };
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  /**
   * ValidationPipe errors carry an array of messages; flatten them into a
   * single readable string so the response shape stays consistent.
   */
  private extractHttpMessage(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    const { message } = response as { message?: string | string[] };
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    return message ?? exception.message;
  }
}
