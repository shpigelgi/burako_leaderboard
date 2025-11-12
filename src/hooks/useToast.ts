import toast from 'react-hot-toast';

/**
 * Custom hook for showing user-friendly toast notifications.
 * Wraps react-hot-toast with consistent styling and error handling.
 */
export function useToast() {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string, error?: unknown) => {
    // Log full error to console for debugging
    if (error) {
      console.error('Error details:', error);
    }
    
    // Show user-friendly message
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  };

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    loading: showLoading,
    dismiss,
    promise,
  };
}
