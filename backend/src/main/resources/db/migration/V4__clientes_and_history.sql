CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    oficina_id INT NOT NULL REFERENCES oficina(id),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_cliente_oficina_nome ON cliente(oficina_id, LOWER(nome));

ALTER TABLE ordem_servico ADD COLUMN cliente_id INT;
ALTER TABLE venda ADD COLUMN cliente_id INT;

ALTER TABLE ordem_servico
    ADD CONSTRAINT fk_ordem_servico_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id);
ALTER TABLE venda
    ADD CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id);

CREATE INDEX idx_ordem_servico_cliente_id ON ordem_servico(cliente_id);
CREATE INDEX idx_venda_cliente_id ON venda(cliente_id);

INSERT INTO cliente (nome, oficina_id, ativo, criado_em, atualizado_em)
SELECT DISTINCT TRIM(os.cliente), os.oficina_id, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ordem_servico os
WHERE os.cliente IS NOT NULL
  AND TRIM(os.cliente) <> ''
  AND os.oficina_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO cliente (nome, oficina_id, ativo, criado_em, atualizado_em)
SELECT DISTINCT TRIM(v.cliente), v.oficina_id, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM venda v
WHERE v.cliente IS NOT NULL
  AND TRIM(v.cliente) <> ''
  AND v.oficina_id IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE ordem_servico os
SET cliente_id = c.id
FROM cliente c
WHERE os.cliente_id IS NULL
  AND os.oficina_id = c.oficina_id
  AND LOWER(TRIM(os.cliente)) = LOWER(c.nome);

UPDATE venda v
SET cliente_id = c.id
FROM cliente c
WHERE v.cliente_id IS NULL
  AND v.oficina_id = c.oficina_id
  AND LOWER(TRIM(v.cliente)) = LOWER(c.nome);
