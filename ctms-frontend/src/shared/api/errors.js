export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { fieldName: message } for validation errors
  }
}
