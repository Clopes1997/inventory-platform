import Swal from 'sweetalert2';

export function showSuccess(message: string) {
  return Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    confirmButtonColor: '#2563eb',
  });
}

export function showError(message: string) {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#dc2626',
  });
}

export async function showConfirm(message: string): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
  });
  return result.isConfirmed ?? false;
}
