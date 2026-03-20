import React from 'react';
import Sidebar from './Sidebar';
import '../styles/theme.css';

const Layout: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  return (
    <div style={{display:'flex'}}>
      <Sidebar />
      <div style={{flex:1, marginLeft:220, minHeight: '100vh', padding: '28px'}}>
        <header style={{display:'flex', justifyContent:'flex-end', marginBottom: 16}}>
          <div style={{color:'var(--gray-600)'}}>Bienvenido Evaluador</div>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
