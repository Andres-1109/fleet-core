import { CallHandler } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { buildExecutionContext } from '../testing/execution-context';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps the result in the success envelope with the real status code', async () => {
    const context = buildExecutionContext({ response: { statusCode: 201 } });
    const next: CallHandler<{ id: string }> = {
      handle: () => of({ id: 'v1' }),
    };

    const result = await lastValueFrom(
      new ResponseInterceptor<{ id: string }>().intercept(context, next),
    );

    expect(result).toEqual({
      success: true,
      statusCode: 201,
      data: { id: 'v1' },
      timestamp: expect.any(String) as string,
    });
  });
});
