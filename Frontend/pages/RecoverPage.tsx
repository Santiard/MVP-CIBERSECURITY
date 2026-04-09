import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';

const RecoverPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      alert('Por favor ingresa un correo electrónico válido.');
      return;
    }
    // Here you would trigger recovery flow; for now, set success
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-light)'
      }}>
        <div style={{position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:12}}>
          <img src={logo} alt="RAY logo" style={{width:42, height:42, borderRadius:8, objectFit:'cover'}} />
          <div style={{fontWeight:800, color:'var(--gray-900)'}}>RAY: Cyber-Madurez Core</div>
        </div>

        <div style={{width:420, maxWidth:'92%', background:'var(--surface-light)', padding:28, borderRadius:12, boxShadow:'var(--shadow-md)', textAlign:'center'}}>
          <h3 style={{marginTop:0, marginBottom:6}}>Enlace enviado</h3>
          <p style={{marginTop:0, marginBottom:18, color:'var(--gray-600)', fontSize:13}}>Se ha enviado un enlace de recuperación a tu correo electrónico.</p>
          <button onClick={() => window.location.href = '/LoginPage'} className="btn btn-primary" style={{width: '200px', margin: '0 auto', display: 'block'}}>Volver al inicio de sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-light)'
    }}>
      <div style={{position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:12}}>
        <img src={logo} alt="RAY logo" style={{width:42, height:42, borderRadius:8, objectFit:'cover'}} />
        <div style={{fontWeight:800, color:'var(--gray-900)'}}>RAY: Cyber-Madurez Core</div>
      </div>

      <form onSubmit={submit} style={{width:420, maxWidth:'92%', background:'var(--surface-light)', padding:28, borderRadius:12, boxShadow:'var(--shadow-md)', textAlign:'center'}}>
        <h3 style={{marginTop:0, marginBottom:6}}>Recuperar Contraseña</h3>
        <p style={{marginTop:0, marginBottom:18, color:'var(--gray-600)', fontSize:13}}>Ingresa tu correo para enviarte el enlace de recuperación.</p>

        <label style={{display:'block', textAlign:'left', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Correo Electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresa tu correo electrónico"
          required
          style={{width:'100%', padding:'12px 14px', borderRadius:8, border:'1px solid var(--gray-200)', marginBottom:18, boxSizing:'border-box', textAlign:'center'}}
        />

        <button type="submit" className="btn btn-primary" style={{width: '200px', margin: '0 auto', display: 'block'}}>Enviar enlace</button>

        <div style={{marginTop:14}}>
          <a href="/LoginPage" style={{color:'var(--link-color)', textDecoration:'none', fontSize:13}}>Volver al inicio de sesión</a>
        </div>
      </form>
    </div>
  );
};

export default RecoverPage;
