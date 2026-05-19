import React from 'react';
import Layout from '../src/components/Layout';
import '../src/styles/theme.css';
import { getCurrentRole, defaultPathByRole } from '../src/utils/auth';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const role = getCurrentRole();
  const nextPath = role === 'admin' ? '/dashboard' : role === 'evaluator' ? '/organizations' : '/evaluations';

  return (
    <Layout>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 40px 48px', color: 'var(--text-primary)' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 48, marginTop: 12 }}>
          <div style={{ display: 'inline-block', color: 'var(--blue-700)', fontSize: 14, fontWeight: 800, marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Plataforma de Evaluación
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--blue-900)', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
            RAY: Cyber-Madurez Core
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--gray-600)', maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
            El puente entre la teoría y la acción: lleva la ciberseguridad de tu organización al siguiente nivel con metodologías estandarizadas.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link to={nextPath} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16, fontWeight: 600, textDecoration: 'none', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}>
              Comenzar ya
            </Link>
          </div>
        </div>

        {/* Content Blocks */}
        <div style={{ display: 'grid', gap: 32, marginBottom: 48 }}>
          
          <div className="card" style={{ padding: 32, background: 'var(--surface-light)', borderLeft: '4px solid var(--blue-500)' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--blue-700)', margin: '0 0 4px' }}>¿Qué es esta aplicación?</h2>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 16px' }}>Un marco estratégico basado en estándares internacionales</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-700)', margin: 0, lineHeight: 1.6 }}>
              Esta aplicación materializa un marco estratégico fundamentado en los lineamientos de la familia de normas ISO/IEC 27000. Su propósito es ofrecer a las organizaciones una metodología clara que integre criterios de madurez y un modelo de puntuación automatizado para medir la seguridad de sus sistemas de información. Todo esto traducido en un modelo "ligero" y adaptado a las realidades y recursos limitados de las PyMEs.
            </p>
          </div>

          <div className="card" style={{ padding: 32, background: 'var(--surface-light)', borderLeft: '4px solid var(--gray-600)' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--gray-600)', margin: '0 0 4px' }}>El Problema que Resuelve</h2>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 16px' }}>Pasa de la incertidumbre a la toma de decisiones informada</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-700)', margin: 0, lineHeight: 1.6 }}>
              Muchas empresas invierten esfuerzos y recursos en medidas de ciberseguridad, pero se enfrentan a un vacío metodológico: carecen de indicadores objetivos y resultados visuales que orienten su toma de decisiones. Sin una forma de medir su madurez, las empresas navegan a ciegas. Nuestra plataforma resuelve este problema al proporcionar mecanismos estructurados para medir la seguridad sin depender de auditorías o procesos altamente costosos.
            </p>
          </div>

        </div>

        {/* Features Grid */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--blue-900)', textAlign: 'center', margin: '0 0 32px' }}>
            ¿Qué obtendrás al realizar la evaluación?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            
            <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 16, background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
                1
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--gray-900)' }}>Diagnóstico Automatizado</h4>
                <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                  Responde a cuestionarios estructurados y deja que nuestro motor de scoring calcule automáticamente el nivel de madurez de tu organización.
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 16, background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
                2
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--gray-900)' }}>Tableros Intuitivos</h4>
                <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                  Visualiza el estado de tu seguridad a través de gráficos y reportes de fácil interpretación, diseñados para que cualquier miembro de la entidad pueda entenderlos.
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 16, background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
                3
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--gray-900)' }}>Identificación de Brechas</h4>
                <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                  Descubre de manera práctica las fortalezas, debilidades y áreas de mejora en tus controles básicos de seguridad.
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 16, background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
                4
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--gray-900)' }}>Mejora Continua</h4>
                <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                  Obtén recomendaciones y una base sólida para priorizar tus inversiones en ciberseguridad, demostrando compromiso con la protección de datos.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>RAY: Cyber-Madurez Core</strong> — Versión 1.0.0 (MVP)
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Desarrollado y operado por el equipo de RAY: Miguel Fabian Robles Angarita, Jesús Santiago Ardila Gómez y Yostin Orlando Lopez Berrio.<br />
            © {new Date().getFullYear()} Todos los derechos reservados.
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem' }}>
            El uso de esta herramienta está sujeto a la licencia comercial y los términos de servicio internos. 
            Su metodología toma como referencia las mejores prácticas internacionales, pero no sustituye una certificación oficial.
          </p>
        </div>

      </div>
    </Layout>
  );
};

export default HomePage;
