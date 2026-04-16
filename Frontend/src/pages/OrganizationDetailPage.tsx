import React, {useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import dataService from '../services/dataService';
import { createEvaluation } from '../services/evaluationApi';

const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any | null>(null);
  const [creatingEvaluation, setCreatingEvaluation] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const list = await dataService.getOrgs();
      const found = (list as any[]).find((o: any) => String(o.id_empresa) === id);
      setOrg(found || null);
    })();
  }, [id]);

  const startEvaluation = async () => {
    if (!org?.id_empresa) return;
    try {
      setCreatingEvaluation(true);
      const created = await createEvaluation({
        id_empresa: org.id_empresa,
      });
      navigate(`/evaluations/${created.id_evaluacion}/workflow`);
    } finally {
      setCreatingEvaluation(false);
    }
  };

  return (
    <Layout>
      <div style={{padding:24}}>
        <h2 style={{margin:0}}>Detalle de la Organización</h2>
        {!org && <div style={{marginTop:12}}>Organización no encontrada.</div>}
        {org && (
          <div style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr 320px', gap:20}}>
            <div className="card">
              <h3 style={{marginTop:0}}>{org.nombre}</h3>
              <div style={{color:'var(--muted)'}}>Sector</div>
              <div style={{marginBottom:12}}>{org.sector}</div>
              <div style={{color:'var(--muted)'}}>Tamaño</div>
              <div style={{marginBottom:12}}>{org.tamano}</div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="card">
                <h4 style={{marginTop:0}}>Acciones</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>
                  Las evaluaciones ligadas a esta empresa se gestionan en <strong>Asignaciones</strong> (no aquí), para
                  mantener separado el catálogo de la empresa del vínculo con evaluaciones.
                </p>
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  <button className="btn btn-primary" onClick={() => navigate('/organizations')}>Volver al listado</button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => navigate(`/asignaciones?empresa=${org.id_empresa}`)}
                  >
                    Ir a asignaciones (esta empresa)
                  </button>
                  <button className="btn" onClick={startEvaluation} disabled={creatingEvaluation}>
                    {creatingEvaluation ? 'Creando...' : 'Iniciar evaluación (rápido)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrganizationDetailPage;
