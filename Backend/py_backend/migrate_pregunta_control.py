"""
migrate_pregunta_control.py

Script de migración one-shot:
- Lee todos los registros existentes en 'preguntas' que aún tienen id_control
- Inserta los pares (id_pregunta, id_control) en la nueva tabla 'pregunta_control'
- Luego elimina la columna id_control de 'preguntas' (ALTER TABLE)

Ejecutar UNA SOLA VEZ antes del primer arranque con los nuevos modelos.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db import engine


def migrate():
    with engine.connect() as conn:
        # 1. Verificar si la columna id_control aún existe en preguntas
        check = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'preguntas' AND column_name = 'id_control'
        """)).fetchone()

        if not check:
            print("✅ La columna id_control ya fue eliminada de 'preguntas'. Migración omitida.")
            return

        # 2. Crear la tabla pregunta_control si no existe
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pregunta_control (
                id_pregunta INTEGER NOT NULL REFERENCES preguntas(id_pregunta) ON DELETE CASCADE,
                id_control  INTEGER NOT NULL REFERENCES controles(id_control)  ON DELETE CASCADE,
                PRIMARY KEY (id_pregunta, id_control)
            )
        """))
        print("✅ Tabla pregunta_control creada (o ya existía).")

        # 3. Migrar pares existentes de preguntas → pregunta_control
        conn.execute(text("""
            INSERT INTO pregunta_control (id_pregunta, id_control)
            SELECT id_pregunta, id_control
            FROM preguntas
            WHERE id_control IS NOT NULL
            ON CONFLICT DO NOTHING
        """))
        print("✅ Pares (id_pregunta, id_control) migrados a pregunta_control.")

        # 4. Agregar columna 'dimension' si no existe
        has_dim = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'preguntas' AND column_name = 'dimension'
        """)).fetchone()
        if not has_dim:
            conn.execute(text("ALTER TABLE preguntas ADD COLUMN dimension VARCHAR"))
            print("✅ Columna 'dimension' agregada a preguntas.")
        else:
            print("✅ Columna 'dimension' ya existe.")

        # 5. Eliminar la columna id_control de preguntas
        conn.execute(text("ALTER TABLE preguntas DROP COLUMN id_control"))
        print("✅ Columna id_control eliminada de preguntas.")

        conn.commit()
        print("\n✅ Migración completada exitosamente.")


if __name__ == "__main__":
    migrate()
