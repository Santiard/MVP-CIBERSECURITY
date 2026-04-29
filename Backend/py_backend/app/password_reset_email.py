"""Envío opcional por SMTP del enlace de recuperación de contraseña."""

import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

_logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """
    Si SMTP_HOST está definido, envía el correo por SMTP (STARTTLS en 587 por defecto).
    Si no, solo registra el enlace en log (uso local sin servidor de correo).
    """
    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD") or ""
    mail_from = (os.getenv("PASSWORD_RESET_MAIL_FROM") or smtp_user or "noreply@localhost").strip()
    use_tls = os.getenv("SMTP_TLS", "true").strip().lower() in {"1", "true", "yes", "on"}

    subject = os.getenv(
        "PASSWORD_RESET_MAIL_SUBJECT",
        "RAY: Cyber-Madurez Core — recuperación de contraseña",
    )
    body = (
        "Has solicitado restablecer tu contraseña.\n\n"
        f"Abre este enlace (válido un tiempo limitado):\n\n{reset_link}\n\n"
        "Si no has sido tú, ignora este mensaje.\n"
    )

    if not smtp_host:
        _logger.warning(
            "SMTP no configurado — enlace de recuperación para %s (revisa logs; no hay envío SMTP): %s",
            to_email,
            reset_link,
        )
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email
    msg.set_content(body)

    ctx = ssl.create_default_context()
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=45) as s:
            s.ehlo()
            if use_tls:
                s.starttls(context=ctx)
                s.ehlo()
            if smtp_user and smtp_password:
                s.login(smtp_user, smtp_password)
            s.sendmail(mail_from, [to_email], msg.as_string())
        _logger.info("Correo de recuperación enviado a %s", to_email)
    except OSError:
        _logger.exception("Fallo SMTP al enviar recuperación a %s", to_email)
        raise
