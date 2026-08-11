# Prospecta 4.0

Plataforma web, editorial e geoespacial do Prospecta 4.0. O aplicativo reúne site institucional, blog, dashboard mineral, painel administrativo, APIs, PostGIS e uma pipeline automatizada do Google Earth Engine.

## Arquitetura

- **Web e API:** Next.js 16, React 19, TypeScript e Vercel.
- **Mapa:** MapLibre GL JS, raster tiles e dados GeoJSON/PostGIS.
- **Dados:** Supabase PostgreSQL com PostGIS e Row Level Security.
- **Autenticação:** Supabase Auth com papéis `admin`, `editor`, `reviewer` e `viewer`.
- **Mídia editorial:** Vercel Blob.
- **Imagens orbitais:** Earth Engine, Cloud Run Jobs e Google Cloud Storage.
- **Observabilidade:** Vercel Analytics, Speed Insights e registros de execução no Postgres.
- **Radar mineral:** feeds especializados, deduplicação, tradução/resumo por IA e curadoria temática.

O protótipo HTML original permanece em `prospecta/`. Durante `dev` e `build`, seus ativos são copiados para `public/legacy` para preservar o acervo original enquanto a aplicação nova evolui.

## Executar localmente

Requisitos: Node.js 24+, npm 11+ e, para o banco local completo, Docker e Supabase CLI.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Sem credenciais, site, blog e dashboard abrem em **modo demonstração** com o conjunto inicial tipado em `lib/seed.ts`. Gravações administrativas ficam bloqueadas até o Supabase ser configurado.

Verificações disponíveis:

```powershell
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Configurar o Supabase

1. Crie um projeto Supabase, preferencialmente na região mais próxima de `gru1`.
2. Execute `supabase/migrations/202607130001_initial.sql` pelo Supabase CLI ou SQL Editor.
3. Copie URL, anon key e service role key para `.env.local` e para os ambientes Production, Preview e Development da Vercel.
4. Em Authentication, crie o primeiro usuário institucional.
5. Edite o e-mail em `supabase/seed-admin.sql` e execute o script.
6. Mantenha `SUPABASE_SERVICE_ROLE_KEY` somente no servidor. Ela nunca pode usar o prefixo `NEXT_PUBLIC_`.

Para desenvolvimento com Supabase CLI:

```powershell
supabase start
supabase db reset
```

As principais views públicas são:

- `posts_public`
- `regions_public`
- `occurrences_public`
- `imagery_periods_public`

As tabelas originais permanecem protegidas por RLS. Alterações em conteúdo e dados espaciais são registradas em `audit_logs`.

## Publicar na Vercel

1. Importe este diretório como um novo projeto.
2. Framework preset: Next.js; build command: `npm run build`.
3. Configure todas as variáveis de `.env.example`.
4. Crie um Blob Store público e vincule `BLOB_READ_WRITE_TOKEN`.
5. Use o domínio final em `NEXT_PUBLIC_SITE_URL`.
6. Gere um segredo aleatório forte para `CRON_SECRET`.
7. Faça o primeiro deploy. O `vercel.json` fixa as Functions em São Paulo e agenda sincronização semanal.

O cron da Vercel chama `/api/cron/sync` com `Authorization: Bearer $CRON_SECRET`. Essa rota registra uma execução e chama o launcher da pipeline no Cloud Run.

O Radar em `/radar` usa as fontes RSS cadastradas em `news_sources`. O cron `/api/cron/news` coleta apenas metadados e trechos oferecidos pelos feeds, elimina URLs repetidas e usa a Responses API com saída estruturada para traduzir, resumir e classificar cada card. Configure `OPENAI_API_KEY`; `OPENAI_NEWS_MODEL` permite trocar o modelo sem alterar código. Cada card preserva o link para a matéria original.

## Pipeline geoespacial

O diretório `geospatial/` produz uma imagem Docker com dois modos:

- `launcher.py`: serviço HTTP autenticado que inicia o Cloud Run Job.
- `pipeline.py`: Job durável que processa Earth Engine, exporta COG e atualiza o Supabase.

APIs necessárias no Google Cloud:

- Earth Engine API
- Cloud Run Admin API
- Cloud Build API
- Artifact Registry API
- Cloud Storage API

A conta de serviço do Job precisa ter acesso ao projeto Earth Engine, escrita no bucket e permissão mínima para acessar os segredos. A conta do launcher precisa de `run.jobs.run` apenas no Job do Prospecta.

Exemplo de build e criação do Job, adaptando projeto, região e secrets:

```powershell
gcloud builds submit geospatial --tag southamerica-east1-docker.pkg.dev/PROJECT/prospecta/pipeline:latest
gcloud run jobs create prospecta-imagery --image southamerica-east1-docker.pkg.dev/PROJECT/prospecta/pipeline:latest --region southamerica-east1 --command python --args pipeline.py,--run-id,MANUAL_RUN_ID,--mode,incremental --task-timeout 21600s --max-retries 2 --set-secrets SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest --set-env-vars EARTH_ENGINE_PROJECT=PROJECT,GCS_BUCKET=prospecta40-tiles,SUPABASE_URL=https://PROJECT.supabase.co
gcloud run deploy prospecta-pipeline-launcher --source geospatial --region southamerica-east1 --no-allow-unauthenticated --set-env-vars CLOUD_RUN_JOB=prospecta-imagery,GOOGLE_CLOUD_REGION=southamerica-east1,PIPELINE_WEBHOOK_SECRET=CHANGE_ME
```

Se o launcher permanecer privado com IAM, configure a chamada Vercel através de um gateway/autenticador compatível. Se optar por permitir invocação pública, a validação obrigatória de `PIPELINE_WEBHOOK_SECRET` continua ativa, mas IAM privado é preferível.

Para tiles dinâmicos de COG, configure `TITILER_BASE_URL` apontando para uma instância TiTiler. Sem ela, a pipeline publica e registra o COG, mas deixa `tile_url` vazio até a etapa de tiling.

## Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/api/posts` | Conteúdo publicado com cache CDN |
| GET | `/api/dashboard` | Regiões, ocorrências e períodos |
| POST | `/api/contact` | Mensagens com validação, honeypot e limite por IP hash |
| POST | `/api/admin/upload` | Upload autenticado de imagens/PDFs até 20 MB |
| GET | `/api/cron/sync` | Disparo autenticado da pipeline |
| GET | `/api/cron/news` | Coleta autenticada do Radar Mineral |

## Operação

- Conteúdo editorial: `/admin`.
- Estado das pipelines: tabela `processing_runs` e painel administrativo.
- Auditoria: tabela `audit_logs`.
- Mensagens: tabela `contact_messages`.
- Métricas públicas são cacheadas por tags; salvar conteúdo invalida o cache do blog.
- Backups do banco e retenção dos objetos devem ser configurados nos planos de produção do Supabase e Google Cloud.

## Segurança

- As chaves administrativas são exclusivamente server-side.
- O banco aplica autorização por linha, independentemente da interface.
- Uploads validam sessão, papel, MIME e tamanho.
- O formulário de contato valida os campos, usa honeypot e limita cinco tentativas por IP hash em 15 minutos.
- O cron e o launcher usam segredos independentes.
- Cabeçalhos de segurança são enviados pelo Next.js.
- Antes de abrir o painel a terceiros, habilite MFA no Supabase e revise a política institucional de retenção e LGPD.
