/**
 * Closed set of failures the directory can report to callers.
 *
 * HTTP layers map these to status codes. Library code returns them inside
 * `Result` instead of throwing, except for truly unexpected programmer errors.
 */

export type LiveSpacesError =
  | {
      readonly kind: "not-implemented";
      readonly operationName: string;
    }
  | {
      readonly kind: "missing-bearer-token";
      readonly message: string;
    }
  | {
      readonly kind: "invalid-space-id";
      readonly rawValue: string;
      readonly message: string;
    }
  | {
      readonly kind: "invalid-user-id";
      readonly rawValue: string;
      readonly message: string;
    }
  | {
      readonly kind: "invalid-filters";
      readonly message: string;
    }
  | {
      readonly kind: "invalid-space-url";
      readonly rawValue: string;
      readonly message: string;
    }
  | {
      readonly kind: "x-api-rate-limited";
      readonly retryAfterSeconds: number | undefined;
      readonly message: string;
    }
  | {
      readonly kind: "x-api-unavailable";
      readonly httpStatus: number | undefined;
      readonly message: string;
    }
  | {
      readonly kind: "x-api-payload-unreadable";
      readonly message: string;
    }
  | {
      readonly kind: "unauthorized-refresh";
      readonly message: string;
    };

export function describeLiveSpacesError(error: LiveSpacesError): string {
  switch (error.kind) {
    case "not-implemented":
      return `LiveSpaces skeleton: ${error.operationName} is not implemented yet.`;
    case "missing-bearer-token":
      return error.message;
    case "invalid-space-id":
      return error.message;
    case "invalid-user-id":
      return error.message;
    case "invalid-filters":
      return error.message;
    case "invalid-space-url":
      return error.message;
    case "x-api-rate-limited":
      return error.message;
    case "x-api-unavailable":
      return error.message;
    case "x-api-payload-unreadable":
      return error.message;
    case "unauthorized-refresh":
      return error.message;
  }
}
