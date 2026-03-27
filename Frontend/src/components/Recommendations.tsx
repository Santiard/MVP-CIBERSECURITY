import React from 'react';

const Recommendations: React.FC<{ items: string[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Recomendaciones Prioritarias</h3>
      <ul>
        {items.map((it, idx) => (
          <li key={idx} style={{ marginBottom: 8 }}>{it}</li>
        ))}
      </ul>
    </div>
  );
};

export default Recommendations;
