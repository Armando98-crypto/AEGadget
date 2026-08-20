# Guia de Deploy — AE Gadget

## Estrutura do Projeto

```
aegadget-design/
├── apps/
│   ├── web/          → Frontend Next.js (Vercel)
│   └── api/          → Backend Express (Railway/Render)
├── .env.example      → Variáveis de ambiente exemplo
└── README.md
```

## 1. Deploy da API (Railway ou Render)

### Opção A: Railway (Recomendado)

1. Criar conta em [railway.app](https://railway.app)
2. Criar novo projeto → "Deploy from GitHub Repo"
3. Selecionar a pasta `apps/api`
4. Adicionar variáveis de ambiente:

```
DATABASE_URL=postgresql://user:password@host:5432/aegadget
JWT_ACCESS_SECRET=seu-secret-aqui-minimo-32-caracteres
JWT_REFRESH_SECRET=outro-secret-aqui-minimo-32-caracteres
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=https://seu-app.vercel.app
NODE_ENV=production
```

5. Adicionar PostgreSQL ( Railway提供 ) ou usar Supabase/Neon
6. Deploy automático

### Opção B: Render

1. Criar conta em [render.com](https://render.com)
2. Criar "Web Service" → Conectar GitHub
3. Configurações:
   - Build Command: `npm install --legacy-peer-deps && npm run build`
   - Start Command: `npx prisma migrate deploy && node dist/server.js`
4. Adicionar variáveis de ambiente (mesmas do Railway)
5. Criar PostgreSQL no Render ou usar externo

## 2. Deploy do Frontend (Vercel)

1. Criar conta em [vercel.com](https://vercel.com)
2. Importar projeto do GitHub
3. Configurações:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm install --legacy-peer-deps && npm run build`
4. Variáveis de ambiente:

```
NEXT_PUBLIC_API_URL=https://sua-api.vercel.app/api
```

5. Deploy

## 3. Base de Dados (Supabase - Gratuito)

1. Criar conta em [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Copiar a URL do PostgreSQL
4. Usar como `DATABASE_URL` na API
5. Depois do deploy, correr as migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 4. Variáveis de Ambiente

### API (apps/api/.env)
```env
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
JWT_ACCESS_SECRET=mínimo-32-caracteres-aleatórios-aqui
JWT_REFRESH_SECRET=outros-32-caracteres-aleatórios-aqui
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
API_PORT=3001
FRONTEND_URL=https://seu-app.vercel.app
NODE_ENV=production
```

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=https://sua-api.onrender.com/api
```

## 5. Deploys Alternativos

### Fly.io (API)
```bash
fly launch
fly deploy
```

### DigitalOcean App Platform
- Suporta Next.js e Node.js nativamente
- Configuração via interface

## 6. Domínio Personalizado

### Vercel (Frontend)
1. Settings → Domains
2. Adicionar domínio
3. Configurar DNS CNAME → `cname.vercel-dns.com`

### API
1. Configurar domínio no Railway/Render
2. Atualizar `FRONTEND_URL` no backend
3. Atualizar `NEXT_PUBLIC_API_URL` no frontend

## 7. SSL/HTTPS

- Vercel: Automático
- Railway: Automático
- Render: Automático
- Fly.io: Automático com `fly certs add`

## 8. Monitoramento

- **Vercel**: Analytics integrado
- **Railway**: Métricas de CPU/RAM
- **Sentry**: Error tracking (gratuito para open source)

## 9. Backup da Base de Dados

```bash
# Supabase
pg_dump $DATABASE_URL > backup.sql

# Railway
railway connect
pg_dump > backup.sql
```

## 10. Custos Estimados (2024)

| Serviço | Plano | Preço |
|---------|-------|-------|
| Vercel | Hobby | $0/mês |
| Railway | Hobby | $5/mês |
| Render | Free | $0/mês |
| Supabase | Free | $0/mês |
| **Total** | | **$0-5/mês** |

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Base de dados criada e migrations aplicadas
- [ ] Seed executado (dados iniciais)
- [ ] API deployada e testada (`/api/health`)
- [ ] Frontend deployado e testado
- [ ] CORS configurado corretamente
- [ ] JWT secrets seguros (não usar defaults)
- [ ] HTTPS ativo
- [ ] Domínio configurado (opcional)
