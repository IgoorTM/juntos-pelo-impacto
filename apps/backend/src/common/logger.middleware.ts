import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const method = req.method;
    const originalUrl = req.originalUrl;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      const message = `${method} ${originalUrl} - ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }

      if ((method === 'POST' || method === 'PATCH') && req.body) {
        this.logger.debug(
          `Body: ${JSON.stringify(req.body as Record<string, unknown>)}`,
        );
      }
    });

    next();
  }
}
