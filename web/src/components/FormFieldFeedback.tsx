import FormHelperText from "@mui/material/FormHelperText";

type FormFieldFeedbackProps = {
  error?: boolean;
  message?: string;
};

export const FormFieldFeedback = ({
  error = false,
  message,
}: FormFieldFeedbackProps) => {
  if (!message) return null;

  return <FormHelperText error={error}>{message}</FormHelperText>;
};
