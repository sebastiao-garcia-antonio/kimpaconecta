# 📘 GUIA DE IMPLANTAÇÃO E DEPLOYMENT DE PRODUÇÃO — KIMPA CONNECT

Este documento é o manual oficial de implantação, configuração e manutenção da plataforma **Kimpa Connect** para a Universidade Kimpa Vita (UKV).

---

## 📋 1. REQUISITOS DO SISTEMA
- **Sistema Operativo**: Linux Ubuntu 22.04 LTS / 24.04 LTS ou Windows Server 2022.
- **Node.js**: v20.x LTS ou superior.
- **PostgreSQL**: v16.x ou v18.x.
- **RAM Mínima**: 4 GB (8 GB recomendado para cargas elevadas).
- **Armazenamento**: 20 GB SSD.

---

## 🚀 2. DEPLOY RÁPIDO COM DOCKER COMPOSE (RECOMENDADO)

### Passo 1: Clonar o Repositório e Configurar Variáveis
```bash
git clone https://github.com/kimpa-vita/kimpa-connect.git
cd kimpa-connect
cp .env.production.example .env
```

### Passo 2: Editar o Ficheiro `.env`
Defina a palavra-passe segura do PostgreSQL e o segredo do NextAuth:
```env
DATABASE_URL="postgresql://postgres:SenhaSegura123@db:5432/kimpa_connect_db?schema=public"
POSTGRES_PASSWORD="SenhaSegura123"
AUTH_SECRET="f8a92b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1"
NEXTAUTH_URL="https://kimpaconnect.ukv.ao"
```

### Passo 3: Iniciar os Contentores
```bash
docker-compose up -d --build
```

### Passo 4: Executar Migrações e Semeadura Inicial
```bash
docker exec -it kimpa_web npx prisma db push
docker exec -it kimpa_web node prisma/seed-users.js
docker exec -it kimpa_web node prisma/seed-feed.js
docker exec -it kimpa_web node prisma/seed-messages.js
```

---

## 🛠️ 3. DEPLOY MANUAL (PM2 + NGINX)

### Passo 1: Instalar Dependências e Compilar
```bash
npm ci
npx prisma generate
npx prisma db push
npm run build
```

### Passo 2: Executar com PM2
```bash
npm install -g pm2
pm2 start server.js --name "kimpa-connect"
pm2 save
pm2 startup
```

---

## 🌐 4. CONFIGURAÇÃO DO REVERSE PROXY NGINX & SSL (HTTPS + WSS)

Crie o ficheiro de configuração do Nginx em `/etc/nginx/sites-available/kimpaconnect`:

```nginx
server {
    server_name kimpaconnect.ukv.ao;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configuração WebSockets para o Socket.IO (Chat em Tempo Real)
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar o site e obter Certificado SSL Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/kimpaconnect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d kimpaconnect.ukv.ao
```

---

## 🔑 5. CONTAS DE TESTE E CREDENCIAIS PADRÃO

| Papel / Função | Email de Acesso | Senha Padrão | Âmbito de Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@kimpa.ao` | `1234` | Gestão Global, Logs e Configurações |
| **Coordenador** | `coordenador@kimpa.ao` | `1234` | Gestão de Curso, Validação Pedagógica |
| **Professor / Docente** | `professor@kimpa.ao` | `1234` | Lançamento de Exames, Presenças, Pautas |
| **Estudante** | `estudante@kimpa.ao` | `1234` | Realização de Provas, Chat Privado, Feed |

---

## 💾 6. BACKUP E RESTAURAÇÃO DA BASE DE DADOS

### Criar Backup (.sql)
```bash
pg_dump -U postgres -d kimpa_connect_db > backup_kimpa_$(date +%Y%m%d).sql
```

### Restaurar Backup
```bash
psql -U postgres -d kimpa_connect_db < backup_kimpa_20260903.sql
```

---

### 🎓 Plataforma Colaborativa Kimpa Connect — Universidade Kimpa Vita (2026)
