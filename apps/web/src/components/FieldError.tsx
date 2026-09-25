interface FieldErrorProps {
  message?: string;
  id?: string;
}

export default function FieldError({ message, id }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}
