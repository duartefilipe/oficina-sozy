# Moto Manager

Sistema de gestao de oficina e loja de motos com backend em Spring Boot e frontend em React.

## Subir sem banco local criado

O banco PostgreSQL e criado automaticamente pelo `docker-compose`.

```bash
docker compose up --build
```

Servicos:

- Frontend: `http://localhost`
- Backend: `http://localhost:8080`
- Postgres: `localhost:5432` (db: `moto_manager`)
- API no frontend: usa `/api` via proxy Nginx para o backend (`backend:8080`)

## Deploy no Portainer (Repository)

- Use Stack via **Git Repository** apontando para este repo.
- Branch: `main`
- Compose path: `docker-compose.yml`
- Nao use Web Editor para esse caso com `build: ./backend` e `build: ./frontend`.

## Observacoes

- O schema inicial e aplicado por Flyway no backend (`V1__init_schema.sql`).
- A regra de custo externo da OS fica isolada em `os_custo_externo` e nao movimenta estoque.
