import { ExecutionContext } from '@nestjs/common';

type Handler = (...args: never[]) => unknown;

/** Minimal ExecutionContext for guard/interceptor/filter tests. */
export function buildExecutionContext(options: {
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  handler?: Handler;
  controller?: abstract new (...args: never[]) => unknown;
}): ExecutionContext {
  const http = {
    getRequest: () => options.request ?? {},
    getResponse: () => options.response ?? {},
    getNext: () => undefined,
  };
  return {
    switchToHttp: () => http,
    getHandler: () => options.handler ?? (() => undefined),
    getClass: () => options.controller ?? Object,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}
