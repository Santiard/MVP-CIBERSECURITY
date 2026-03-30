import React, {useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import dataService from '../services/dataService';

const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const list = await dataService.getOrgs();
      const found = (list as any[]).find((o: any) => o.id === id);
      setOrg(found || null);
    })();
  }, [id]);

  return (
    <Layout>
      <div style={{padding:24}}>
        <h2 style={{margin:0}}>Detalle de la Organización</h2>
        {!org && <div style={{marginTop:12}}>Organización no encontrada.</div>}
        {org && (
          <div style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr 320px', gap:20}}>
            <div className="card">
              <h3 style={{marginTop:0}}>{org.name}</h3>
              <div style={{color:'var(--muted)'}}>Correo</div>
              <div style={{marginBottom:12}}>{org.email}</div>
              <div style={{color:'var(--muted)'}}>NIT</div>
              <div style={{marginBottom:12}}>{org.nit}</div>
              <div style={{color:'var(--muted)'}}>Dirección</div>
              <div style={{marginBottom:12}}>{org.address}</div>
              <div style={{color:'var(--muted)'}}>Teléfono</div>
              <div style={{marginBottom:12}}>{org.phone}</div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="card">
                <h4 style={{marginTop:0}}>Acciones</h4>
                <div style={{display:'flex', gap:8}}>
                  <button className="btn btn-primary" onClick={() => navigate('/organizations')}>Volver</button>
                  <button className="btn" onClick={() => alert('Inicio evaluación - lógica no implementada')}>Iniciar Evaluación</button>
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
