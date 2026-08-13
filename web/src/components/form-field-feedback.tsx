import FormHelperText from "@mui/material/FormHelperText";

interface FormFieldFeedbackProps {
  error?: boolean;
  message?: string;
}

export function FormFieldFeedback(props: FormFieldFeedbackProps) {
  const { error = false, message } = props;

  if (!message) return null;

  return <FormHelperText error={error}>{message}</FormHelperText>;
}
