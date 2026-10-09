/** An expected failure that maps directly to an HTTP status and a `{ error }` body. */
export class DomainError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const badRequest = (message: string) => new DomainError(400, message);
export const unauthorized = (message = "Authentication required") => new DomainError(401, message);
export const forbidden = (message = "You do not have permission to perform this action") =>
  new DomainError(403, message);
export const notFound = (message: string) => new DomainError(404, message);
export const conflict = (message: string) => new DomainError(409, message);

export const ERRORS = {
  invalidLogin: "Invalid email or password",
  credentialExpired: "Credential expired, cannot claim shift",
  credentialMissing: "No verified credential on file, cannot claim shift",
  shiftNotFound: "Shift not found",
  shiftNotOpen: "Shift is not open",
  shiftNotFilled: "Only a filled shift can be cancelled",
  agencyNotFound: "Agency not found",
} as const;
