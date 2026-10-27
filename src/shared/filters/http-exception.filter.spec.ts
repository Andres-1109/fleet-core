import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainErrorType,
  DomainException,
} from '../exceptions/domain.exception';
import { buildExecutionContext } from '../testing/execution-context';
import { HttpExceptionFilter } from './http-exception.filter';

class TestDomainException extends DomainException {
  constructor(type: DomainErrorType) {
    super(`domain failure: ${type}`, type);
  }
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function catchError(exception: unknown): {
    statusCode: number;
    body: Record<string, unknown>;
  } {
    const json = jest.fn<undefined, [Record<string, unknown>]>();
    const status = jest.fn<{ json: typeof json }, [number]>(() => ({ json }));
    const host = buildExecutionContext({
      request: { url: '/maintenances' },
      response: { status },
    }) as unknown as ArgumentsHost;
    filter.catch(exception, host);
    return {
      statusCode: status.mock.calls[0][0],
      body: json.mock.calls[0][0],
    };
  }

  it('wraps an HttpException in the error envelope', () => {
    const { statusCode, body } = catchError(
      new NotFoundException('Vehicle X not found'),
    );
    expect(statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      statusCode: 404,
      message: 'Vehicle X not found',
      path: '/maintenances',
      timestamp: expect.any(String) as string,
    });
  });

  it('joins ValidationPipe messages into one string', () => {
    const { body } = catchError(
      new BadRequestException(['name is empty', 'year too low']),
    );
    expect(body.message).toBe('name is empty; year too low');
  });

  it.each([
    [DomainErrorType.VALIDATION, 400],
    [DomainErrorType.UNAUTHORIZED, 401],
    [DomainErrorType.FORBIDDEN, 403],
    [DomainErrorType.NOT_FOUND, 404],
    [DomainErrorType.CONFLICT, 409],
  ])('maps a %s domain exception to HTTP %i', (type, expected) => {
    const { statusCode, body } = catchError(new TestDomainException(type));
    expect(statusCode).toBe(expected);
    expect(body.message).toBe(`domain failure: ${type}`);
  });

  it('hides unexpected errors behind a generic 500', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { statusCode, body } = catchError(
      new Error('connection string leaked'),
    );
    expect(statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
