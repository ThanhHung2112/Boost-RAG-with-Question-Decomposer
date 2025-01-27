import { useToastMessage } from "@/hooks/useToastMessage";

export const ToastNotifyProvider = () => {
  const { Notification } = useToastMessage();

  return <>{Notification}</>;
};
