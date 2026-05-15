import http from 'k6/http';
import { check, sleep } from 'k6';

// Test específico para validar login con credenciales correctas
export const options = {
  stages: [
    { duration: '1m', target: 1 },  // 1 VU por 1 minuto
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:8000';

// Credenciales CORRECTAS del Admin
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin2026!Secure*';

export default function () {
  console.log('🔐 Iniciando prueba de Login...');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`);

  const loginPayload = JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  console.log('\n→ Enviando POST /auth/token');
  const response = http.post(`${BASE_URL}/auth/token`, loginPayload, params);

  console.log(`← Status Code: ${response.status}`);
  console.log(`← Response Time: ${response.timings.duration}ms`);
  
  check(response, {
    'Login status is 200': (r) => {
      const pass = r.status === 200;
      console.log(`  ${pass ? '✅' : '❌'} Status code: ${r.status}`);
      return pass;
    },
    'Login response has access_token': (r) => {
      const token = r.json('access_token');
      const pass = token !== null && token !== undefined;
      console.log(`  ${pass ? '✅' : '❌'} Token presente: ${pass ? '✓' : '✗'}`);
      return pass;
    },
    'Login response has user_id': (r) => {
      const uid = r.json('user_id');
      const pass = uid !== null && uid !== undefined;
      console.log(`  ${pass ? '✅' : '❌'} User ID: ${uid || 'N/A'}`);
      return pass;
    },
    'Login response has name': (r) => {
      const name = r.json('name');
      const pass = name !== null && name !== undefined;
      console.log(`  ${pass ? '✅' : '❌'} Nombre: ${name || 'N/A'}`);
      return pass;
    },
    'Login response has role': (r) => {
      const role = r.json('role');
      const pass = role !== null && role !== undefined;
      console.log(`  ${pass ? '✅' : '❌'} Role: ${role || 'N/A'}`);
      return pass;
    },
    'Login response time < 500ms': (r) => {
      const pass = r.timings.duration < 500;
      console.log(`  ${pass ? '✅' : '❌'} Latencia: ${r.timings.duration}ms`);
      return pass;
    },
    'token_type is bearer': (r) => {
      const tt = r.json('token_type');
      const pass = tt === 'bearer';
      console.log(`  ${pass ? '✅' : '❌'} Token type: ${tt || 'N/A'}`);
      return pass;
    },
  });

  // Si el login fue exitoso, mostrar el token
  if (response.status === 200) {
    const token = response.json('access_token');
    console.log(`\n✅ LOGIN EXITOSO`);
    console.log(`Token: ${token ? token.substring(0, 50) + '...' : 'N/A'}`);
    
    // Prueba adicional: usar el token para acceder a /evaluations
    sleep(0.5);
    
    console.log('\n→ Validando token con GET /evaluations');
    const authParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    
    const evalResponse = http.get(`${BASE_URL}/evaluations`, authParams);
    console.log(`← Status Code: ${evalResponse.status}`);
    
    check(evalResponse, {
      'GET /evaluations with valid token returns 200': (r) => {
        const pass = r.status === 200;
        console.log(`  ${pass ? '✅' : '❌'} Acceso con token válido: ${pass ? 'OK' : 'FAIL'}`);
        return pass;
      },
      'GET /evaluations returns array': (r) => {
        const pass = Array.isArray(r.json());
        console.log(`  ${pass ? '✅' : '❌'} Respuesta es array: ${pass ? 'OK' : 'FAIL'}`);
        return pass;
      },
    });
  } else {
    console.log(`\n❌ LOGIN FALLIDO`);
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body}`);
  }
}

export function teardown() {
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ Prueba de Login Completada');
  console.log('═══════════════════════════════════════════\n');
}
