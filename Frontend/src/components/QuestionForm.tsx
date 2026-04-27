import React, { useEffect, useState } from "react";
import dataService, { type Question } from "../services/dataService";
import { useAlert } from "./alerts/AlertProvider";

type Props = {
  open: boolean;
  initial?: Question | null;
  onClose: () => void;
  onSaved: () => void;
  controlId: number;
};

const QuestionForm: React.FC<Props> = ({ open, initial, onClose, onSaved, controlId }) => {
  const [texto, setTexto] = useState(initial?.text ?? "");
  const [peso, setPeso] = useState(initial?.peso ?? 1);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (open) {
      setTexto(initial?.text ?? "");
      setPeso(initial?.peso ?? 1);
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields: string[] = [];
    const textoTrim = texto.trim();
    if (!textoTrim) missingFields.push("Texto");
    if (!Number.isFinite(peso) || peso < 0.1) missingFields.push("Peso");
    if (missingFields.length > 0) {
      showAlert({
        type: "warning",
        title: "Advertencia",
        message: `Faltan campos obligatorios: ${missingFields.join(", ")}.`,
      });
      return;
    }

    setSaving(true);
    try {
      if (initial?.id) {
        await dataService.updateQuestion(initial.id, {
          text: textoTrim,
          peso,
          controlId: String(controlId),
        });
      } else {
        await dataService.createQuestion({
          text: textoTrim,
          controlId: String(controlId),
          dimension: "",
          order: 0,
          active: true,
          peso,
        });
      }
      showAlert({
        type: "success",
        title: "Exito",
        message: initial?.id ? "Pregunta actualizada correctamente." : "Pregunta creada correctamente.",
      });
      onSaved();
      onClose();
    } catch {
      showAlert({
        type: "error",
        title: "Error",
        message: "No se pudo guardar la pregunta.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,6,23,0.4)",
        zIndex: 40,
      }}
    >
      <form
        noValidate
        onSubmit={(e) => void submit(e)}
        style={{ width: 420, background: "var(--surface)", padding: 20, borderRadius: 12 }}
      >
        <h3 style={{ marginTop: 0 }}>{initial?.id ? "Editar pregunta" : "Nueva pregunta"}</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 0, marginBottom: 8 }}>* Campos obligatorios</p>
        <label style={{ display: "block", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>Texto *</label>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid var(--border)",
            boxSizing: "border-box",
          }}
        />
        <label style={{ display: "block", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>Peso *</label>
        <input
          type="number"
          value={peso}
          onChange={(e) => setPeso(Number(e.target.value))}
          min={0.1}
          max={10}
          step={0.1}
          required
          style={{ width: 120, padding: 10, borderRadius: 8, border: "1px solid var(--border)", boxSizing: "border-box" }}
        />
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
