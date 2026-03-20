import React from 'react';
import Layout from '../src/components/Layout';
import '../src/styles/theme.css';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <div style={{padding:12}}>
        <h1 style={{marginTop:0}}>Página principal (Home)</h1>
        <p>Bienvenido — esta es una página de inicio por defecto para navegar la UI.</p>
        <div style={{marginTop:12}}>
          <a href="/DashboardPage" style={{color:'var(--blue-700)', textDecoration:'none'}}>Ir al Dashboard</a>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
