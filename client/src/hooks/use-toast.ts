// Simple toast hook for notifications
export function useToast() {
  const toast = ({ title, description, variant }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    // Simple alert for now - in production you'd want a proper toast component
    const message = title ? `${title}: ${description || ''}` : description || '';
    if (variant === "destructive") {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  };

  return { toast };
}