import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
}

interface ExceptionResponse {
  message?: string | ValidationError[];
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ExceptionResponse;

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(exceptionResponse)}`,
    );

    // Formata resposta de validação (ValidationPipe)
    if (status === 400 && Array.isArray(exceptionResponse?.message)) {
      return response.status(status).json({
        statusCode: status,
        message: 'Validation failed',
        errors: exceptionResponse.message.map((msg: ValidationError) => ({
          field: msg.property,
          messages: Object.values(msg.constraints || {}),
        })),
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Resposta padrão para outras exceções HTTP
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse.message === 'string'
          ? exceptionResponse.message
          : exception.message;

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
