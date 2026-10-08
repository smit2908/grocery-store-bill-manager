import { useEffect } from "react";

function Toast({
  message,
  type = "success",
  onClose,
  duration = 3000,
}) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [message, duration, onClose]);

  if (!message) {
    return null;
  }

  const icon =
    type === "error"
      ? "bi-exclamation-circle-fill"
      : type === "warning"
      ? "bi-exclamation-triangle-fill"
      : "bi-check-circle-fill";

  return (
    <div
      className="position-fixed bottom-0 end-0 p-3"
      style={{
        zIndex: 9999,
      }}
    >
      <div
        className={`alert ${
          type === "error"
            ? "alert-danger"
            : type === "warning"
            ? "alert-warning"
            : "alert-success"
        } d-flex align-items-center gap-2 shadow-sm mb-0`}
        role="alert"
      >
        <i className={`bi ${icon}`}></i>

        <span>{message}</span>

        <button
          type="button"
          className="btn-close ms-2"
          onClick={onClose}
          aria-label="Close"
        ></button>
      </div>
    </div>
  );
}

export default Toast;