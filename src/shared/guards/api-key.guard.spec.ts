import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildExecutionContext } from '../testing/execution-context';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  // Spaces and empty entries in API_KEYS must be tolerated.
  const guard = new ApiKeyGuard(
    new ConfigService({ API_KEYS: ' key-one , key-two,, ' }),
  );
  const withHeader = (value?: string | string[]): ExecutionContext =>
    buildExecutionContext({
      request: { headers: value === undefined ? {} : { 'x-api-key': value } },
    });

  it.each(['key-one', 'key-two'])('accepts the configured key %s', (key) => {
    expect(guard.canActivate(withHeader(key))).toBe(true);
  });

  it.each([
    ['a missing header', undefined],
    ['an unknown key', 'key-three'],
    ['a prefix of a valid key', 'key-on'],
    ['an empty key', ''],
    ['a repeated header', ['key-one', 'key-two']],
  ])('rejects %s', (_label, value) => {
    expect(() => guard.canActivate(withHeader(value))).toThrow(
      UnauthorizedException,
    );
  });
});
