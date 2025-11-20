// ARQUIVO: src/lib/apiClient.ts
import { OpenAPI } from './api';

// CRÍTICO: No ambiente Node.js (Server Side), a URL deve ser absoluta.
// Definimos o padrão para http://localhost:8000 se a variável de ambiente não existir.
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log para debug (veremos isso no terminal do VSCode)
console.log('API Base URL definida para:', OpenAPI.BASE);

export * from './api';