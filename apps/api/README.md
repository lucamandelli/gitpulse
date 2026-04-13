# @gitpulse/api

Backend API do GitPulse construído com Fastify + TypeScript.

## Estrutura de pastas

```
src/
├── server.ts       # Entry point — inicializa e starta o servidor
├── app.ts          # Builder do app Fastify (registra plugins e rotas)
├── config/
│   └── env.ts      # Validação de variáveis de ambiente (Zod)
├── routes/
│   └── health.ts   # GET /health — healthcheck
├── services/       # Lógica de negócio
└── lib/            # Utilitários compartilhados
```

## Scripts

| Comando                | Descrição                       |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Inicia servidor com hot-reload  |
| `npm run build`        | Compila TypeScript para `dist/` |
| `npm run start`        | Roda build de produção          |
| `npm run lint`         | Roda ESLint                     |
| `npm run lint:fix`     | Roda ESLint com auto-fix        |
| `npm run format`       | Formata código com Prettier     |
| `npm run format:check` | Verifica formatação             |

## Variáveis de ambiente

| Variável       | Tipo   | Default | Obrigatória  |
| -------------- | ------ | ------- | ------------ |
| `API_PORT`     | number | `3333`  | Não          |
| `DATABASE_URL` | string | —       | Não (ainda)  |
