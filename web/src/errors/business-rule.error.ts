export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

export function getBusinessRuleErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  return error instanceof BusinessRuleError ? error.message : fallbackMessage;
}
