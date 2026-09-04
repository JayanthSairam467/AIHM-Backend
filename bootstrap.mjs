import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();

const files = {
  'package.json': JSON.stringify({
    name: 'omniscribe-backend',
    version: '1.0.0',
    private: true,
    type: 'module',
    workspaces: ['packages/*', 'apps/*'],
    scripts: {
      build: 'npm run build --workspaces --if-present',
      typecheck: 'tsc --build',
      lint: 'eslint . --ext .ts',
      'lint:fix': 'eslint . --ext .ts --fix',
      format: 'prettier --write "**/*.{ts,json,md}"',
      test: 'vitest run',
      'test:unit': 'vitest run --project unit',
      'test:integration': 'vitest run --project integration',
      'test:contract': 'vitest run --project contract',
      'test:e2e': 'vitest run --project e2e',
      'contracts:validate': 'node scripts/validate-contract.js',
      'contracts:generate': 'node scripts/generate-types.js',
      clean: 'rimraf apps/*/dist packages/*/dist'
    },
    devDependencies: {
      '@types/node': '^22.5.4',
      '@typescript-eslint/eslint-plugin': '^7.0.0',
      '@typescript-eslint/parser': '^7.0.0',
      eslint: '^8.57.0',
      prettier: '^3.3.0',
      rimraf: '^6.0.0',
      typescript: '^5.5.4',
      vitest: '^2.0.0'
    }
  }, null, 2),
  
  'tsconfig.base.json': JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      isolatedModules: true
    }
  }, null, 2),
  
  'tsconfig.json': JSON.stringify({
    files: [],
    references: [
      { path: 'packages/contracts' },
      { path: 'packages/config' },
      { path: 'packages/observability' },
      { path: 'packages/data-layer' },
      { path: 'packages/messaging' },
      { path: 'apps/scribe-service' },
      { path: 'apps/gemini-service' },
      { path: 'apps/fhir-formatter-service' },
      { path: 'apps/api-gateway' }
    ]
  }, null, 2),
  
  '.env.example': `NODE_ENV=development

# Service Ports
API_GATEWAY_PORT=4000
SCRIBE_SERVICE_PORT=4001
GEMINI_SERVICE_PORT=4002
FHIR_FORMATTER_SERVICE_PORT=4003

# Service URLs (internal)
SCRIBE_SERVICE_URL=http://localhost:4001
GEMINI_SERVICE_URL=http://localhost:4002
FHIR_FORMATTER_SERVICE_URL=http://localhost:4003

# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=fhir-exports

# Redis
REDIS_URL=redis://localhost:6379

# Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.7-flash
`,
  
  '.eslintrc.cjs': `module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.cjs'],
};
`,
  
  '.prettierrc': JSON.stringify({
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2
  }, null, 2),
  
  '.gitignore': `node_modules/
dist/
.env
*.log
coverage/
.turbo/
`,
  
  'docker-compose.yml': `version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: omniscribe
      POSTGRES_PASSWORD: omniscribe_dev
      POSTGRES_DB: omniscribe
    ports:
      - '54322:5432'
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./infrastructure/supabase/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U omniscribe']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:
  pg-data:
`,
  
  // Workspace: packages/contracts
  'packages/contracts/package.json': JSON.stringify({
    name: '@omniscribe/contracts',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' }
  }, null, 2),
  'packages/contracts/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true }
  }, null, 2),
  'packages/contracts/src/index.ts': 'export {}; // placeholder\n',
  
  // Workspace: packages/config
  'packages/config/package.json': JSON.stringify({
    name: '@omniscribe/config',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { zod: '^3.23.8', dotenv: '^16.4.5' }
  }, null, 2),
  'packages/config/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [{ path: '../contracts' }]
  }, null, 2),
  'packages/config/src/index.ts': 'export {};\n',
  
  // Workspace: packages/observability
  'packages/observability/package.json': JSON.stringify({
    name: '@omniscribe/observability',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { pino: '^9.4.0', 'pino-http': '^10.3.0' },
    devDependencies: { '@types/node': '^22.5.4' }
  }, null, 2),
  'packages/observability/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true }
  }, null, 2),
  'packages/observability/src/index.ts': 'export {};\n',
  
  // Workspace: packages/data-layer
  'packages/data-layer/package.json': JSON.stringify({
    name: '@omniscribe/data-layer',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { '@supabase/supabase-js': '^2.45.3' }
  }, null, 2),
  'packages/data-layer/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [{ path: '../contracts' }]
  }, null, 2),
  'packages/data-layer/src/index.ts': 'export {};\n',
  
  // Workspace: packages/messaging
  'packages/messaging/package.json': JSON.stringify({
    name: '@omniscribe/messaging',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { bullmq: '^5.13.0', ioredis: '^5.4.1' }
  }, null, 2),
  'packages/messaging/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [{ path: '../contracts' }]
  }, null, 2),
  'packages/messaging/src/index.ts': 'export {};\n',
  
  // Workspace: apps/api-gateway
  'apps/api-gateway/package.json': JSON.stringify({
    name: '@omniscribe/api-gateway',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { express: '^4.19.2', cors: '^2.8.5', helmet: '^7.1.0', 'http-proxy-middleware': '^3.0.0' },
    devDependencies: { '@types/express': '^4.17.21', '@types/cors': '^2.8.17' }
  }, null, 2),
  'apps/api-gateway/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [
      { path: '../../packages/contracts' },
      { path: '../../packages/config' },
      { path: '../../packages/observability' },
      { path: '../../packages/data-layer' },
      { path: '../../packages/messaging' }
    ]
  }, null, 2),
  'apps/api-gateway/src/main.ts': "console.log('api-gateway');\n",
  
  // Workspace: apps/scribe-service
  'apps/scribe-service/package.json': JSON.stringify({
    name: '@omniscribe/scribe-service',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { express: '^4.19.2', cors: '^2.8.5', uuid: '^10.0.0', zod: '^3.23.8' },
    devDependencies: { '@types/express': '^4.17.21', '@types/cors': '^2.8.17', '@types/uuid': '^10.0.0' }
  }, null, 2),
  'apps/scribe-service/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [
      { path: '../../packages/contracts' },
      { path: '../../packages/config' },
      { path: '../../packages/observability' },
      { path: '../../packages/data-layer' },
      { path: '../../packages/messaging' }
    ]
  }, null, 2),
  'apps/scribe-service/src/main.ts': "console.log('scribe-service');\n",
  
  // Workspace: apps/gemini-service
  'apps/gemini-service/package.json': JSON.stringify({
    name: '@omniscribe/gemini-service',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { express: '^4.19.2', '@google/genai': '^0.0.0', zod: '^3.23.8' },
    devDependencies: { '@types/express': '^4.17.21' }
  }, null, 2),
  'apps/gemini-service/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [
      { path: '../../packages/contracts' },
      { path: '../../packages/config' },
      { path: '../../packages/observability' }
    ]
  }, null, 2),
  'apps/gemini-service/src/main.ts': "console.log('gemini-service');\n",
  
  // Workspace: apps/fhir-formatter-service
  'apps/fhir-formatter-service/package.json': JSON.stringify({
    name: '@omniscribe/fhir-formatter-service',
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'tsc --build' },
    dependencies: { express: '^4.19.2', uuid: '^10.0.0', zod: '^3.23.8' },
    devDependencies: { '@types/express': '^4.17.21', '@types/uuid': '^10.0.0' }
  }, null, 2),
  'apps/fhir-formatter-service/tsconfig.json': JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist', composite: true },
    references: [
      { path: '../../packages/contracts' },
      { path: '../../packages/config' },
      { path: '../../packages/observability' },
      { path: '../../packages/data-layer' }
    ]
  }, null, 2),
  'apps/fhir-formatter-service/src/main.ts': "console.log('fhir-formatter-service');\n",
  
  // Empty files
  'infrastructure/supabase/migrations/.gitkeep': '',
  'infrastructure/docker/.gitkeep': '',
  'tests/contract/.gitkeep': '',
  'tests/e2e/.gitkeep': '',
  
  // Scripts
  'scripts/validate-contract.js': `import fs from 'fs';
import yaml from 'yaml';
try {
  const file = fs.readFileSync('openapi.yaml', 'utf8');
  const doc = yaml.parse(file);
  if (!doc.openapi || !doc.info || !doc.paths) {
    throw new Error('Invalid OpenAPI document');
  }
  console.log('OpenAPI validation successful.');
} catch (err) {
  console.error('Validation failed:', err.message);
  process.exit(1);
}
`,
  'scripts/generate-types.js': 'console.log("Placeholder for Chunk 2");\n'
};

async function createAll() {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    console.log('Created', filePath);
  }
}

createAll().catch(err => {
  console.error(err);
  process.exit(1);
});
