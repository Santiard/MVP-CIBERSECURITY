import React from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  fallback?: string;
  className?: string;
};

export default function BackButton({ fallback = "/asignaciones", className }: Props) {
  const navigate = useNavigate();
  const handle = () => {
    try {
      if (window.history.length > 1) navigate(-1);
      else navigate(fallback);
    } catch (_e) {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      className={className ? className : "btn btn-secondary"}
      aria-label="Volver"
      style={{ marginRight: 12 }}
    >
      ← Volver
    </button>
  );
}
