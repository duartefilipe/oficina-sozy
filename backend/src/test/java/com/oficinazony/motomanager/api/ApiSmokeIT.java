package com.oficinazony.motomanager.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Smoke tests for every REST controller: real HTTP, JWT, PostgreSQL (Testcontainers), Flyway.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApiSmokeIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String superToken;
    private static String adminToken;
    private static int oficinaId;
    private static int produtoId;
    private static int clienteId;
    private static int osId;
    private static String uniq(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @Order(1)
    void login_superadmin() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"superadmin\",\"password\":\"superadmin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();
        JsonNode body = objectMapper.readTree(r.getResponse().getContentAsString());
        superToken = body.get("token").asText();
        assertThat(superToken).isNotBlank();
    }

    @Test
    @Order(2)
    void superadmin_me_and_oficina_crud() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + superToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("superadmin"));

        String nomeOficina = uniq("OficinaSmoke");
        MvcResult create = mockMvc.perform(post("/api/oficinas")
                        .header("Authorization", "Bearer " + superToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"" + nomeOficina + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();
        oficinaId = objectMapper.readTree(create.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/oficinas").header("Authorization", "Bearer " + superToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/oficinas/" + oficinaId)
                        .header("Authorization", "Bearer " + superToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"" + nomeOficina + "-renomeada\",\"ativo\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value(nomeOficina + "-renomeada"));
    }

    @Test
    @Order(3)
    void superadmin_creates_admin_user() throws Exception {
        String adminUser = uniq("adminsmoke");
        MvcResult r = mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + superToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Admin Smoke",
                                  "username": "%s",
                                  "password": "adminpass123",
                                  "role": "ADMIN",
                                  "oficinaId": %d
                                }
                                """.formatted(adminUser, oficinaId)))
                .andExpect(status().isCreated())
                .andReturn();
        assertThat(objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asInt()).isPositive();

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + adminUser + "\",\"password\":\"adminpass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(login.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @Order(4)
    void admin_produtos_clientes_os_vendas_relatorio() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        MvcResult p = mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Peca Smoke",
                                  "tipo": "PECA",
                                  "precoCusto": 1.00,
                                  "precoVenda": 2.00,
                                  "qtdEstoque": 10
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        produtoId = objectMapper.readTree(p.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/produtos").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/produtos/" + produtoId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Peca Smoke Atualizada",
                                  "tipo": "PECA",
                                  "precoCusto": 1.50,
                                  "precoVenda": 3.00,
                                  "qtdEstoque": 10
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult c = mockMvc.perform(post("/api/clientes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"ClienteSmoke\",\"oficinaId\":" + oficinaId + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        clienteId = objectMapper.readTree(c.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/clientes").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/clientes/" + clienteId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/clientes/" + clienteId + "/historico").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        MvcResult os = mockMvc.perform(post("/api/ordens-servico")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "placaMoto": "SMK1A00",
                                  "clienteId": %d,
                                  "status": "ABERTA",
                                  "pecasEstoque": [],
                                  "servicos": [],
                                  "custosExternos": []
                                }
                                """.formatted(clienteId)))
                .andExpect(status().isCreated())
                .andReturn();
        osId = objectMapper.readTree(os.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/ordens-servico").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/ordens-servico/" + osId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/ordens-servico/" + osId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"EM_EXECUCAO\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/ordens-servico/" + osId + "/recalcular")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        MvcResult v = mockMvc.perform(post("/api/vendas")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clienteId": %d,
                                  "status": "PENDENTE",
                                  "itens": [{"produtoId": %d, "quantidade": 1, "valorUnitario": 3.00}]
                                }
                                """.formatted(clienteId, produtoId)))
                .andExpect(status().isCreated())
                .andReturn();
        int vendaId = objectMapper.readTree(v.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/vendas").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/vendas/" + vendaId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/vendas/" + vendaId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clienteId": %d,
                                  "status": "PENDENTE",
                                  "itens": [{"produtoId": %d, "quantidade": 2, "valorUnitario": 3.00}]
                                }
                                """.formatted(clienteId, produtoId)))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/vendas/" + vendaId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PAGA\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/relatorios/resumo").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receitaTotal").exists());

        String u = uniq("usrsmoke");
        MvcResult ures = mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Usuario Smoke",
                                  "username": "%s",
                                  "password": "usrpass12",
                                  "role": "USUARIO"
                                }
                                """.formatted(u)))
                .andExpect(status().isCreated())
                .andReturn();
        int usrId = objectMapper.readTree(ures.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/users/" + usrId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Usuario Smoke Alt",
                                  "username": "%s",
                                  "password": "",
                                  "role": "USUARIO",
                                  "ativo": true
                                }
                                """.formatted(u)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/users/" + usrId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(5)
    void superadmin_produto_com_oficinaId_e_relatorio_filtro() throws Exception {
        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + superToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "oficinaId": %d,
                                  "nome": "Prod Super",
                                  "tipo": "PECA",
                                  "precoCusto": 0,
                                  "precoVenda": 0,
                                  "qtdEstoque": 0
                                }
                                """.formatted(oficinaId)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/relatorios/resumo").param("oficinaId", String.valueOf(oficinaId))
                        .header("Authorization", "Bearer " + superToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(6)
    void admin_forbidden_relatorio_filtro_oficina() throws Exception {
        mockMvc.perform(get("/api/relatorios/resumo").param("oficinaId", "1")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(7)
    void cleanup_delete_os_and_oficina_cascade() throws Exception {
        mockMvc.perform(delete("/api/ordens-servico/" + osId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/oficinas/" + oficinaId).header("Authorization", "Bearer " + superToken))
                .andExpect(status().isNoContent());
    }
}
