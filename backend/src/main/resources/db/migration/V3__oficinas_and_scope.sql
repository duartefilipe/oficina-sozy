CREATE TABLE oficina (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO oficina (id, nome, ativo, criado_em, atualizado_em)
SELECT u.id, 'Oficina ' || u.nome, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM app_user u
WHERE u.role = 'ADMIN'
ON CONFLICT (id) DO NOTHING;

INSERT INTO oficina (nome, ativo, criado_em, atualizado_em)
SELECT 'Oficina Legado', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM oficina);

SELECT setval('oficina_id_seq', (SELECT MAX(id) FROM oficina));

ALTER TABLE app_user ADD COLUMN oficina_id INT;
ALTER TABLE venda ADD COLUMN oficina_id INT;
ALTER TABLE ordem_servico ADD COLUMN oficina_id INT;
ALTER TABLE produto ADD COLUMN oficina_id INT;

UPDATE app_user u
SET oficina_id = u.id
WHERE u.role = 'ADMIN'
  AND u.oficina_id IS NULL
  AND EXISTS (SELECT 1 FROM oficina o WHERE o.id = u.id);

UPDATE app_user u
SET oficina_id = u.created_by_admin_id
WHERE u.role = 'USUARIO'
  AND u.created_by_admin_id IS NOT NULL
  AND u.oficina_id IS NULL;

UPDATE app_user u
SET oficina_id = a.oficina_id
FROM app_user a
WHERE u.role = 'USUARIO'
  AND u.created_by_admin_id = a.id
  AND u.oficina_id IS NULL;

UPDATE app_user
SET oficina_id = (SELECT id FROM oficina ORDER BY id LIMIT 1)
WHERE role <> 'SUPERADMIN' AND oficina_id IS NULL;

UPDATE venda
SET oficina_id = admin_group_id
WHERE oficina_id IS NULL AND admin_group_id IS NOT NULL;

UPDATE ordem_servico
SET oficina_id = admin_group_id
WHERE oficina_id IS NULL AND admin_group_id IS NOT NULL;

UPDATE venda
SET oficina_id = (SELECT id FROM oficina ORDER BY id LIMIT 1)
WHERE oficina_id IS NULL;

UPDATE ordem_servico
SET oficina_id = (SELECT id FROM oficina ORDER BY id LIMIT 1)
WHERE oficina_id IS NULL;

UPDATE produto
SET oficina_id = (
    SELECT u.oficina_id
    FROM app_user u
    WHERE u.role = 'ADMIN' AND u.oficina_id IS NOT NULL
    ORDER BY u.id
    LIMIT 1
)
WHERE oficina_id IS NULL;

UPDATE produto
SET oficina_id = (SELECT id FROM oficina ORDER BY id LIMIT 1)
WHERE oficina_id IS NULL;

ALTER TABLE app_user
    ADD CONSTRAINT fk_app_user_oficina FOREIGN KEY (oficina_id) REFERENCES oficina(id);
ALTER TABLE venda
    ADD CONSTRAINT fk_venda_oficina FOREIGN KEY (oficina_id) REFERENCES oficina(id);
ALTER TABLE ordem_servico
    ADD CONSTRAINT fk_ordem_servico_oficina FOREIGN KEY (oficina_id) REFERENCES oficina(id);
ALTER TABLE produto
    ADD CONSTRAINT fk_produto_oficina FOREIGN KEY (oficina_id) REFERENCES oficina(id);

CREATE INDEX idx_app_user_oficina_id ON app_user(oficina_id);
CREATE INDEX idx_venda_oficina_id ON venda(oficina_id);
CREATE INDEX idx_ordem_servico_oficina_id ON ordem_servico(oficina_id);
CREATE INDEX idx_produto_oficina_id ON produto(oficina_id);
