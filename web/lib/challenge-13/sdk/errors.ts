export class SDKError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends SDKError {
  constructor(message: string, public readonly fields: Record<string, string>) {
    super(message, 400);
  }
}

export class AuthError extends SDKError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class NetworkError extends SDKError {
  constructor(message: string) {
    super(message);
  }
}

export class ApiError extends SDKError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
  }
}
