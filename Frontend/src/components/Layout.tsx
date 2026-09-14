import React from 'react';
import Sidebar from './Sidebar';
import '../styles/theme.css';
import { getStoredAuthUser } from '../utils/auth';

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  evaluator: 'Evaluador',
  user_nivel_bajo: 'Usuario (Nivel Bajo)',
  user_nivel_medio: 'Usuario (Nivel Medio)',
  user_nivel_alto: 'Usuario (Nivel Alto)',
  user: 'Usuario', // legacy fallback
};

const Layout: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  const user = getStoredAuthUser();
  const role = user?.role?.trim().toLowerCase() ?? '';
  const isUser = role.startsWith('user');
  const [userOrgName, setUserOrgName] = React.useState(localStorage.getItem('userOrgName') || '');

  React.useEffect(() => {
    const handleStorage = () => setUserOrgName(localStorage.getItem('userOrgName') || '');
    window.addEventListener('userOrgNameChanged', handleStorage);
    return () => window.removeEventListener('userOrgNameChanged', handleStorage);
  }, []);

  const welcome =
    user?.name != null && user.name.trim() !== ''
      ? `Hola, ${user.name.trim()} · ${roleLabel[role] ?? 'Cuenta'} ${userOrgName && isUser ? `· ${userOrgName}` : ''}`
      : `Bienvenido · ${roleLabel[role] ?? 'Sesión activa'}`;

  return (
    <div style={{display:'flex'}}>
      <Sidebar />
      <div style={{flex:1, marginLeft:220, minHeight: '100vh', padding: '28px'}}>
        <header style={{display:'flex', justifyContent:'flex-end', marginBottom: 16}}>
          <div style={{color:'var(--gray-600)'}}>{welcome}</div>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
