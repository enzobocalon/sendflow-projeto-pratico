export interface Feedback {
  message: string;
  severity: "error" | "success";
}

export function getFeedback(
  successMessage: string,
  errorMessage: string,
): Feedback | null {
  if (successMessage) {
    return { message: successMessage, severity: "success" };
  }

  if (errorMessage) {
    return { message: errorMessage, severity: "error" };
  }

  return null;
}
