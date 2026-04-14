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
      navigate(`/reports/${created.id_evaluacion}`);
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
                <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                  <button className="btn btn-primary" onClick={() => navigate('/organizations')}>Volver</button>
                  <button className="btn" onClick={startEvaluation} disabled={creatingEvaluation}>
                    {creatingEvaluation ? 'Creando...' : 'Iniciar Evaluación'}
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
