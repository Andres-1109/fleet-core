import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto, SuccessEnvelopeDto } from './api-envelope.dto';

interface ApiSuccessOptions {
  description: string;
  /** Defaults to 200. */
  status?: HttpStatus;
  isArray?: boolean;
}

/**
 * Documents a successful response inside the standard envelope:
 * { success, statusCode, data: <model>, timestamp }.
 */
export function ApiSuccess(
  model: Type<unknown>,
  options: ApiSuccessOptions,
): MethodDecorator {
  const dataSchema = options.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(SuccessEnvelopeDto, model),
    ApiResponse({
      status: options.status ?? HttpStatus.OK,
      description: options.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessEnvelopeDto) },
          { properties: { data: dataSchema } },
        ],
      },
    }),
  );
}

interface ApiErrorOptions {
  /** 400 — request body, query, or path parameters fail validation. */
  badRequest?: string;
  /** 401 — missing, invalid, or expired credentials. */
  unauthorized?: string;
  /** 403 — authenticated but not allowed. */
  forbidden?: string;
  /** 404 — referenced resource does not exist. */
  notFound?: string;
  /** 409 — business rule violation or conflict. */
  conflict?: string;
}

const ERROR_STATUS_BY_OPTION: ReadonlyArray<
  [keyof ApiErrorOptions, HttpStatus]
> = [
  ['badRequest', HttpStatus.BAD_REQUEST],
  ['unauthorized', HttpStatus.UNAUTHORIZED],
  ['forbidden', HttpStatus.FORBIDDEN],
  ['notFound', HttpStatus.NOT_FOUND],
  ['conflict', HttpStatus.CONFLICT],
];

/** Documents the error responses an endpoint can return, using the error envelope. */
export function ApiErrors(options: ApiErrorOptions): MethodDecorator {
  const responses = ERROR_STATUS_BY_OPTION.flatMap(([option, status]) => {
    const description = options[option];
    return description
      ? [ApiResponse({ status, description, type: ErrorResponseDto })]
      : [];
  });
  return applyDecorators(ApiExtraModels(ErrorResponseDto), ...responses);
}
