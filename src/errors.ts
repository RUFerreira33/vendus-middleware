export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return {
      ok: false,
      error: this.message,
      status: this.status,
      details: this.details ?? undefined
    };
  }
}
