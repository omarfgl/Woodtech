export class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(message, 400);
export const unauthorized = (message) => new HttpError(message, 401);
export const serverError = (message) => new HttpError(message, 500);
