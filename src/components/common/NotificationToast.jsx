import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';

export default function NotificationToast() {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="toast-icon success" size={20} />,
    warning: <Bell className="toast-icon warning" size={20} />,
    error: <AlertCircle className="toast-icon error" size={20} />,
    info: <Info className="toast-icon info" size={20} />
  };

  return (
    <div className={`notification-toast ${toast.type || 'success'} show`}>
      {icons[toast.type] || icons.success}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
