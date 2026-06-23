export const confirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
  const result = window.confirm(message);
  if (result) {
    onConfirm();
  } else if (onCancel) {
    onCancel();
  }
  return result;
};