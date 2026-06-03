package com.fracexec.api.company;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.dto.AnnualRevenueRange;
import com.fracexec.api.company.dto.CompanyRegistrationRequest;
import com.fracexec.api.company.dto.EmployeeRange;
import com.fracexec.api.shared.auth.dto.LoginRequest;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CompanyRegistrationControllerTest {

    @Autowired MockMvc       mockMvc;
    @Autowired ObjectMapper  objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String REGISTER_URL = "/api/v1/companies/register";
    private static final String LOGIN_URL    = "/api/v1/auth/login";

    // CNPJ válido real: 11.222.333/0001-81
    private static final String VALID_CNPJ = "11.222.333/0001-81";

    private CompanyRegistrationRequest validRequest(String email) {
        return new CompanyRegistrationRequest(
            "Empresa Teste LTDA",
            VALID_CNPJ,
            "Tecnologia",
            EmployeeRange.E_11_50,
            AnnualRevenueRange.R_1M_5M,
            "João Silva",
            email
        );
    }

    @Test
    void registroValido_retorna201_e_criaCadastroComStatusPendente() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest("pme@teste.com"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.companyId").exists())
            .andExpect(jsonPath("$.message").value(
                "Cadastro recebido. O time FracExec ativará seu acesso em breve."));

        // Verificar que a empresa foi criada com status PENDING_ACTIVATION
        Company company = companyRepository.findAll().stream()
            .filter(c -> c.getResponsibleEmail().equals("pme@teste.com"))
            .findFirst()
            .orElseThrow();
        assert company.getStatus() == CompanyStatus.PENDING_ACTIVATION;
    }

    @Test
    void cnpjInvalido_retorna400() throws Exception {
        CompanyRegistrationRequest req = new CompanyRegistrationRequest(
            "Empresa Teste", "11.222.333/0001-00", // dígito verificador errado
            "Tecnologia", EmployeeRange.E_11_50,
            AnnualRevenueRange.R_1M_5M, "João", "pme2@teste.com"
        );
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.detail").value("CNPJ inválido. Verifique e tente novamente."));
    }

    @Test
    void cnpjComFormatoInvalido_retorna400_comErroValidacao() throws Exception {
        CompanyRegistrationRequest req = new CompanyRegistrationRequest(
            "Empresa Teste", "12345678901234", // sem máscara
            "Tecnologia", EmployeeRange.E_11_50,
            AnnualRevenueRange.R_1M_5M, "João", "pme3@teste.com"
        );
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.cnpj").exists());
    }

    @Test
    void emailDuplicado_retorna409_comMensagemCorreta() throws Exception {
        // Criar usuário com o mesmo e-mail
        userRepository.save(new User("pme.dup@teste.com",
            passwordEncoder.encode("pass"), Role.PME));

        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest("pme.dup@teste.com"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.detail").value(
                "Este e-mail já possui cadastro. Acesse sua conta ou recupere a senha."));
    }

    @Test
    void cnpjDuplicado_retorna409() throws Exception {
        // Registrar empresa com o mesmo CNPJ primeiro
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest("primeiro@teste.com"))))
            .andExpect(status().isCreated());

        // Tentar registrar novamente com o mesmo CNPJ
        CompanyRegistrationRequest dup = new CompanyRegistrationRequest(
            "Outra Empresa", VALID_CNPJ, "Saúde",
            EmployeeRange.E_51_200, AnnualRevenueRange.R_5M_20M,
            "Maria Souza", "segundo@teste.com"
        );
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dup)))
            .andExpect(status().isConflict());
    }

    @Test
    void pmePendingActivation_tentandoLogin_retorna403_comMensagemCorreta() throws Exception {
        // Criar usuário PME e empresa PENDING_ACTIVATION diretamente com senha conhecida
        String knownPassword = "Senha@123!";
        User pmeUser = new User("pme.login@teste.com",
            passwordEncoder.encode(knownPassword), Role.PME);
        userRepository.save(pmeUser);

        Company company = new Company(
            "Empresa Login Teste", "11.222.333/0001-81",
            "Tecnologia", EmployeeRange.E_11_50.name(),
            AnnualRevenueRange.R_1M_5M.name(),
            "João Login", "pme.login@teste.com", pmeUser
        );
        companyRepository.save(company);

        // Tentar login — deve retornar 403
        LoginRequest loginReq = new LoginRequest("pme.login@teste.com", knownPassword);
        mockMvc.perform(post(LOGIN_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.detail").value(
                "Seu cadastro está em análise. Você receberá um e-mail quando o acesso for ativado."));
    }

    @Test
    void camposObrigatoriosFaltando_retorna400() throws Exception {
        String bodyIncompleto = "{\"legalName\":\"Empresa\"}";
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(bodyIncompleto))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").exists());
    }
}
