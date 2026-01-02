/**
 * TOAST PROVIDER
 *
 * Context provider for managing toast notifications throughout the app.
 *
 * Usage:
 * import { useToast } from '../providers/ToastProvider';
 *
 * function MyComponent() {
 *   const { showToast } = useToast();
 *
 *   const handleSuccess = () => {
 *     showToast({
 *       type: 'success',
 *       message: 'Operation completed successfully!',
 *     });
 *   };
 * }
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastConfig } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((config: ToastConfig) => {
    // If a toast is already visible, hide it first
    if (visible) {
      setVisible(false);
      // Small delay to allow animation to complete
      setTimeout(() => {
        setToastConfig(config);
        setVisible(true);
      }, 250);
    } else {
      setToastConfig(config);
      setVisible(true);
    }
  }, [visible]);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastConfig && (
        <Toast
          {...toastConfig}
          visible={visible}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
