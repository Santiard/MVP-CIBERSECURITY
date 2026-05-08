"""Envío del enlace de recuperación de contraseña.

Prioridad de transporte:
1. RESEND_API_KEY definida → usa la API de Resend (https://resend.com)
2. SMTP_HOST definida     → SMTP directo con STARTTLS
3. Ninguna               → solo log (modo desarrollo sin correo)
"""

from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

import httpx

_logger = logging.getLogger(__name__)

APP_NAME = "RAY: Cyber-Madurez Core"


def _html_body(reset_link: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#f4f6fb;margin:0;padding:32px 0;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;
              box-shadow:0 2px 12px rgba(0,0,0,.08);padding:36px 32px;">
    <h2 style="margin-top:0;color:#1e3a5f;">{APP_NAME}</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Has solicitado restablecer tu contraseña. Haz clic en el botón para definir una nueva.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{reset_link}"
         style="background:#2563eb;color:#fff;text-decoration:none;padding:13px 32px;
                border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">
        Restablecer contraseña
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">
      Este enlace es válido por <strong>60&nbsp;minutos</strong> y solo puede usarse una vez.<br>
      Si no realizaste esta solicitud, ignora este mensaje — tu contraseña no cambiará.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      {APP_NAME} &mdash; Plataforma de evaluación de ciberseguridad
    </p>
  </div>
</body>
</html>"""


def _text_body(reset_link: str) -> str:
    return (
        f"Has solicitado restablecer tu contraseña en {APP_NAME}.\n\n"
        f"Abre este enlace (válido 60 minutos, único uso):\n{reset_link}\n\n"
        "Si no realizaste esta solicitud, ignora este mensaje."
    )


# ── Transporte 1: Resend ──────────────────────────────────────────────────────

def _send_via_resend(to_email: str, reset_link: str, api_key: str) -> None:
    mail_from = os.getenv("PASSWORD_RESET_MAIL_FROM", "onboarding@resend.dev").strip()
    subject = os.getenv(
        "PASSWORD_RESET_MAIL_SUBJECT",
        f"{APP_NAME} — recuperación de contraseña",
    )
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "from": f"{APP_NAME} <{mail_from}>",
            "to": [to_email],
            "subject": subject,
            "html": _html_body(reset_link),
            "text": _text_body(reset_link),
        },
        timeout=20,
    )
    if response.status_code >= 400:
        _logger.error("Resend API error %s: %s", response.status_code, response.text)
        raise RuntimeError(f"Resend error {response.status_code}: {response.text}")
    _logger.info("Correo de recuperación enviado a %s vía Resend", to_email)


# ── Transporte 2: SMTP ────────────────────────────────────────────────────────

def _send_via_smtp(to_email: str, reset_link: str) -> None:
    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD") or ""
    mail_from = (os.getenv("PASSWORD_RESET_MAIL_FROM") or smtp_user or "noreply@localhost").strip()
    use_tls = os.getenv("SMTP_TLS", "true").strip().lower() in {"1", "true", "yes", "on"}
    subject = os.getenv(
        "PASSWORD_RESET_MAIL_SUBJECT",
        f"{APP_NAME} — recuperación de contraseña",
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email
    msg.set_content(_text_body(reset_link))
    msg.add_alternative(_html_body(reset_link), subtype="html")

    ctx = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port, timeout=45) as s:
        s.ehlo()
        if use_tls:
            s.starttls(context=ctx)
            s.ehlo()
        if smtp_user and smtp_password:
            s.login(smtp_user, smtp_password)
        s.sendmail(mail_from, [to_email], msg.as_string())
    _logger.info("Correo de recuperación enviado a %s vía SMTP", to_email)


# ── Punto de entrada público ──────────────────────────────────────────────────

def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Envía el correo de recuperación usando el transporte disponible."""
    resend_key = (os.getenv("RESEND_API_KEY") or "").strip()
    smtp_host  = (os.getenv("SMTP_HOST") or "").strip()

    if resend_key:
        _send_via_resend(to_email, reset_link, resend_key)
        return

    if smtp_host:
        try:
            _send_via_smtp(to_email, reset_link)
        except OSError:
            _logger.exception("Fallo SMTP al enviar recuperación a %s", to_email)
            raise
        return

    # Sin transporte configurado — solo log (desarrollo)
    _logger.warning(
        "Sin transporte de correo configurado. "
        "Enlace de recuperación para %s (solo log): %s",
        to_email,
        reset_link,
    )
