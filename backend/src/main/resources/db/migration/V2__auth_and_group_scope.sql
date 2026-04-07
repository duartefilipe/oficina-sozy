CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_by_admin_id INT REFERENCES app_user(id),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE venda ADD COLUMN admin_group_id INT;
ALTER TABLE ordem_servico ADD COLUMN admin_group_id INT;
