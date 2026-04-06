CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    qtd_estoque INT NOT NULL DEFAULT 0,
    chassi VARCHAR(50),
    renavam VARCHAR(50),
    ano INT
);

CREATE TABLE venda (
    id SERIAL PRIMARY KEY,
    cliente VARCHAR(100),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2),
    status VARCHAR(20)
);

CREATE TABLE venda_item (
    id SERIAL PRIMARY KEY,
    venda_id INT NOT NULL REFERENCES venda(id),
    produto_id INT NOT NULL REFERENCES produto(id),
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE ordem_servico (
    id SERIAL PRIMARY KEY,
    placa_moto VARCHAR(10) NOT NULL,
    cliente VARCHAR(100),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    valor_total DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE os_peca_estoque (
    id SERIAL PRIMARY KEY,
    os_id INT NOT NULL REFERENCES ordem_servico(id),
    produto_id INT NOT NULL REFERENCES produto(id),
    quantidade INT NOT NULL,
    valor_cobrado DECIMAL(10,2) NOT NULL
);

CREATE TABLE os_mao_obra (
    id SERIAL PRIMARY KEY,
    os_id INT NOT NULL REFERENCES ordem_servico(id),
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(10,2) NOT NULL
);

CREATE TABLE os_custo_externo (
    id SERIAL PRIMARY KEY,
    os_id INT NOT NULL REFERENCES ordem_servico(id),
    descricao VARCHAR(200) NOT NULL,
    custo_aquisicao DECIMAL(10,2) NOT NULL,
    valor_cobrado DECIMAL(10,2) NOT NULL
);
