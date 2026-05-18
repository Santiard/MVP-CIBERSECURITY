import React, { useEffect, useState } from "react";
import dataService, { type Question } from "../services/dataService";
import { useAlert } from "./alerts/AlertProvider";

import questionBankApi from "../services/questionBankApi";

type Props = {
  open: boolean;
  initial?: Question | null;
  onClose: () => void;
  onSaved: (createdId?: string) => void;
  controlId?: number;
};

const QuestionForm: React.FC<Props> = ({ open, initial, onClose, onSaved, controlId }) => {
  const [texto, setTexto] = useState(initial?.text ?? "");
  const [dimension, setDimension] = useState(initial?.dimension ?? "");
  const [peso, setPeso] = useState(initial?.peso ?? 1);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (open) {
      setTexto(initial?.text ?? "");
      setDimension(initial?.dimension ?? "");
      setPeso(initial?.peso ?? 1);
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields: string[] = [];
    const textoTrim = texto.trim();
    if (!textoTrim) missingFields.push("Texto");
    if (!dimension.trim()) missingFields.push("Dimensión");
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
      let returnedId: string | undefined;
      if (initial?.id) {
        await questionBankApi.update(initial.id, {
          text: textoTrim,
          dimension: dimension.trim(),
          peso,
        });
        returnedId = initial.id;
      } else {
        const created = await questionBankApi.create({
          text: textoTrim,
          dimension: dimension.trim(),
          peso,
        });
        if (controlId) {
          await questionBankApi.linkToControl(created.id, controlId);
        }
        returnedId = created.id;
      }
      showAlert({
        type: "success",
        title: "Éxito",
        message: initial?.id ? "Pregunta actualizada correctamente." : "Pregunta agregada correctamente.",
      });
      onSaved(returnedId);
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
        <label style={{ display: "block", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>Dimensión *</label>
        <input
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
          placeholder="Ej: Confidencialidad, Integridad, Disponibilidad..."
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
