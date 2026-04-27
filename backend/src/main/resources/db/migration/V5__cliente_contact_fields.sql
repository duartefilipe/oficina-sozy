ALTER TABLE cliente ADD COLUMN sobrenome VARCHAR(120);
ALTER TABLE cliente ADD COLUMN email VARCHAR(160);
ALTER TABLE cliente ADD COLUMN telefone VARCHAR(30);
ALTER TABLE cliente ADD COLUMN data_aniversario DATE;
ALTER TABLE cliente ADD COLUMN cidade VARCHAR(120);

DROP INDEX IF EXISTS uq_cliente_oficina_nome;
CREATE UNIQUE INDEX uq_cliente_oficina_nome_sobrenome ON cliente(oficina_id, LOWER(nome), LOWER(COALESCE(sobrenome, '')));
