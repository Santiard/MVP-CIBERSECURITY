import http from 'k6/http';
import { check } from 'k6';

// Configuración de pruebas de seguridad
export const options = {
  stages: [
    { duration: '1m', target: 1 },
  ],
  thresholds: {
    'checks': ['rate>0.8'],
  },
};

const BASE_URL = 'http://localhost:8000';

// 1. Prueba: SQL Injection básica
function testSQLInjection() {
  console.log('\n>>> Probando SQL Injection...');
  
  // Intento 1: En el campo email
  const sqlPayload1 = JSON.stringify({
    email: "admin' OR '1'='1",
    password: "anything"
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response1 = http.post(`${BASE_URL}/auth/token`, sqlPayload1, params);
  
  check(response1, {
    'SQLi attempt 1 returns 422 or 401 (not 200)': (r) => r.status !== 200,
    'SQLi attempt 1 no database error message': (r) => !r.body.includes('SQL') && !r.body.includes('database'),
  });

  // Intento 2: Union-based
  const sqlPayload2 = JSON.stringify({
    email: "test@test.com' UNION SELECT * FROM users--",
    password: "pass"
  });

  const response2 = http.post(`${BASE_URL}/auth/token`, sqlPayload2, params);
  
  check(response2, {
    'SQLi attempt 2 (UNION) not authenticated': (r) => r.status !== 200,
  });

  console.log('SQL Injection tests completed');
}

// 2. Prueba: XSS (Cross-Site Scripting)
function testXSS() {
  console.log('\n>>> Probando XSS...');
  
  const xssPayload = JSON.stringify({
    email: 'test@test.com',
    name: '<img src=x onerror="alert(\'XSS\')" />',
    password: 'TestPass123!@'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${BASE_URL}/auth/register`, xssPayload, params);
  
  check(response, {
    'XSS payload registration status 200 or 422': (r) => r.status === 200 || r.status === 422 || r.status === 409,
    'XSS payload not executed in response': (r) => !r.body.includes('onerror'),
  });

  console.log('XSS tests completed');
}

// 3. Prueba: Acceso sin autorización
function testUnauthorizedAccess() {
  console.log('\n>>> Probando acceso sin autorización...');
  
  // Sin token en endpoint protegido
  const response1 = http.get(`${BASE_URL}/evaluations`);
  
  check(response1, {
    'GET /evaluations without token returns 401 or 403': (r) => r.status === 401 || r.status === 403 || r.status === 422,
  });

  // Con token inválido
  const params = {
    headers: {
      'Authorization': 'Bearer invalid_token_12345',
    },
  };

  const response2 = http.get(`${BASE_URL}/evaluations`, params);
  
  check(response2, {
    'GET /evaluations with invalid token returns 401': (r) => r.status === 401 || r.status === 403,
  });

  // Intento de acceso a endpoint administrativo sin permisos
  const response3 = http.get(`${BASE_URL}/users`, params);
  
  check(response3, {
    'GET /users with invalid token returns 401 or 403': (r) => r.status === 401 || r.status === 403,
  });

  console.log('Unauthorized access tests completed');
}

// 4. Prueba: Fuerza bruta en login
function testBruteForce() {
  console.log('\n>>> Probando resistencia a fuerza bruta...');
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Intentos múltiples con contraseña incorrecta
  let failCount = 0;
  for (let i = 0; i < 5; i++) {
    const payload = JSON.stringify({
      email: 'admin@example.com',
      password: 'wrongpassword' + i
    });

    const response = http.post(`${BASE_URL}/auth/token`, payload, params);
    
    if (response.status === 401) {
      failCount++;
    }
  }

  check(failCount > 0, {
    'Brute force returns 401 for incorrect passwords': failCount > 0,
  });

  console.log(`Brute force test: ${failCount}/5 intentos rechazados`);
}

// 5. Prueba: Validación de formularios
function testFormValidation() {
  console.log('\n>>> Probando validación de formularios...');
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Email inválido
  const payload1 = JSON.stringify({
    email: 'not-an-email',
    password: 'ValidPass123!@'
  });

  const response1 = http.post(`${BASE_URL}/auth/token`, payload1, params);
  
  check(response1, {
    'Invalid email format returns error': (r) => r.status === 422 || r.status === 401,
  });

  // Contraseña débil
  const payload2 = JSON.stringify({
    email: 'test@test.com',
    name: 'Test User',
    password: 'weak'  // Contraseña débil
  });

  const response2 = http.post(`${BASE_URL}/auth/register`, payload2, params);
  
  check(response2, {
    'Weak password returns 422': (r) => r.status === 422,
    'Weak password error message present': (r) => r.body.includes('password') || r.body.includes('strong'),
  });

  // Campo obligatorio faltante
  const payload3 = JSON.stringify({
    email: 'test@test.com'
    // Falta password
  });

  const response3 = http.post(`${BASE_URL}/auth/register`, payload3, params);
  
  check(response3, {
    'Missing required field returns 422': (r) => r.status === 422,
  });

  console.log('Form validation tests completed');
}

// 6. Prueba: Headers de seguridad
function testSecurityHeaders() {
  console.log('\n>>> Probando headers de seguridad...');
  
  const response = http.get(`${BASE_URL}/health`);
  
  check(response, {
    'Response status is 200': (r) => r.status === 200,
    'Has CORS header': (r) => r.headers['Access-Control-Allow-Origin'] !== undefined,
  });

  // Nota: Falta verificar algunos headers importantes
  console.log('Security headers detected:');
  console.log('- Access-Control-Allow-Origin: ' + (response.headers['Access-Control-Allow-Origin'] || 'Not set'));
  console.log('- Content-Type: ' + (response.headers['Content-Type'] || 'Not set'));
  console.log('- X-Content-Type-Options: ' + (response.headers['X-Content-Type-Options'] || 'Not set (missing!)'));
  console.log('- X-Frame-Options: ' + (response.headers['X-Frame-Options'] || 'Not set (missing!)'));
  console.log('- Strict-Transport-Security: ' + (response.headers['Strict-Transport-Security'] || 'Not set (missing!)'));
}

// 7. Prueba: Autenticación débil / Token exposure
function testWeakAuthentication() {
  console.log('\n>>> Probando debilidades en autenticación...');
  
  // Intento 1: Credenciales por defecto
  const defaultCreds = [
    { email: 'admin@example.com', password: 'admin' },
    { email: 'admin@example.com', password: 'password' },
    { email: 'admin@example.com', password: 'Admin123!@' }, // Esta probablemente funcione
  ];

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let validCount = 0;
  defaultCreds.forEach((creds) => {
    const payload = JSON.stringify(creds);
    const response = http.post(`${BASE_URL}/auth/token`, payload, params);
    
    if (response.status === 200) {
      validCount++;
      console.log(`✓ Credencial válida encontrada: ${creds.email} / ${creds.password}`);
    }
  });

  check(validCount > 0, {
    'Default credentials detected': validCount > 0,
  });
}

// 8. Prueba: Path traversal
function testPathTraversal() {
  console.log('\n>>> Probando Path Traversal...');
  
  const pathPayloads = [
    '/organizations/../../../etc/passwd',
    '/evaluations/../../sensitive_data',
  ];

  pathPayloads.forEach((path) => {
    const response = http.get(`${BASE_URL}${path}`);
    
    check(response, {
      'Path traversal attempt rejected': (r) => r.status !== 200 || !r.body.includes('root:'),
    });
  });

  console.log('Path traversal tests completed');
}

// Main execution
export default function () {
  console.log('========================================');
  console.log('  INICIANDO PRUEBAS DE SEGURIDAD');
  console.log('  MVP CIBERSECURITY Backend');
  console.log('========================================');

  testSQLInjection();
  testXSS();
  testUnauthorizedAccess();
  testBruteForce();
  testFormValidation();
  testSecurityHeaders();
  testWeakAuthentication();
  testPathTraversal();

  console.log('\n========================================');
  console.log('  PRUEBAS DE SEGURIDAD COMPLETADAS');
  console.log('========================================\n');
}

// Teardown
export function teardown(data) {
  console.log('\n=== RECOMENDACIONES DE SEGURIDAD ===');
  console.log('1. Implementar rate limiting en endpoints de auth');
  console.log('2. Hashear contraseñas con bcrypt o argon2');
  console.log('3. Implementar CORS más restrictivo');
  console.log('4. Agregar headers de seguridad (X-Frame-Options, CSP, HSTS)');
  console.log('5. Validar y sanitizar todas las entradas');
  console.log('6. Implementar JWT con expiración');
  console.log('7. Logging y auditoría de intentos fallidos');
  console.log('8. HTTPS en producción');
}
