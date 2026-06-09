package com.fracexec.api.shared.auth;

import com.fracexec.api.company.Company;
import com.fracexec.api.company.CompanyRepository;
import com.fracexec.api.company.CompanyStatus;
import com.fracexec.api.shared.auth.dto.LoginRequest;
import com.fracexec.api.shared.auth.dto.RefreshTokenRequest;
import com.fracexec.api.shared.auth.dto.RegisterRequest;
import com.fracexec.api.shared.auth.dto.ResetPasswordRequest;
import com.fracexec.api.shared.auth.dto.ForgotPasswordRequest;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.RefreshTokenRepository;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.auth.service.AuthService;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ForbiddenException;
import com.fracexec.api.shared.exception.InvalidRequestException;
import com.fracexec.api.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceImplTest {

    @Autowired AuthService authService;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void register_roleAdmin_lancaInvalidRequestException() {
        var req = new RegisterRequest("admin2@test.com", "Password@1", Role.ADMIN);
        assertThrows(InvalidRequestException.class, () -> authService.register(req));
    }

    @Test
    void register_emailDuplicado_lancaBusinessRuleException() {
        authService.register(new RegisterRequest("dup@test.com", "Pass@1234", Role.EXECUTIVE));
        assertThrows(BusinessRuleException.class,
            () -> authService.register(new RegisterRequest("dup@test.com", "Pass@1234", Role.EXECUTIVE)));
    }

    @Test
    void register_executivo_retornaTokens() {
        var resp = authService.register(new RegisterRequest("exec.as@test.com", "Pass@1234", Role.EXECUTIVE));
        assertNotNull(resp.accessToken());
        assertNotNull(resp.refreshToken());
        assertEquals("EXECUTIVE", resp.role());
    }

    @Test
    void login_credenciaisValidas_retornaTokens() {
        authService.register(new RegisterRequest("login.as@test.com", "Pass@1234", Role.EXECUTIVE));
        var resp = authService.login(new LoginRequest("login.as@test.com", "Pass@1234"));
        assertNotNull(resp.accessToken());
        assertEquals("EXECUTIVE", resp.role());
    }

    @Test
    void login_pmePendingActivation_lancaForbiddenException() {
        authService.register(new RegisterRequest("pme.pending@test.com", "Pass@1234", Role.PME));
        User user = userRepository.findByEmail("pme.pending@test.com").orElseThrow();
        Company co = new Company("Emp Pending", "55.555.555/0001-55", "Tech",
            "E_11_50", "R_1M_5M", "R", "pme.pending@test.com", user);
        co.setStatus(CompanyStatus.PENDING_ACTIVATION);
        companyRepository.save(co);

        assertThrows(ForbiddenException.class,
            () -> authService.login(new LoginRequest("pme.pending@test.com", "Pass@1234")));
    }

    @Test
    void refresh_tokenValido_retornaNovoTokens() {
        var regResp = authService.register(new RegisterRequest("ref.as@test.com", "Pass@1234", Role.EXECUTIVE));
        var refreshResp = authService.refresh(new RefreshTokenRequest(regResp.refreshToken()));
        assertNotNull(refreshResp.accessToken());
        assertNotEquals(regResp.refreshToken(), refreshResp.refreshToken());
    }

    @Test
    void refresh_tokenInvalido_lancaUnauthorizedException() {
        assertThrows(UnauthorizedException.class,
            () -> authService.refresh(new RefreshTokenRequest("token-invalido-qualquer")));
    }

    @Test
    void refresh_tokenRevogado_lancaUnauthorizedException() {
        var resp = authService.register(new RegisterRequest("rev.as@test.com", "Pass@1234", Role.EXECUTIVE));
        // Usa o refresh token — ele é revogado após uso
        authService.refresh(new RefreshTokenRequest(resp.refreshToken()));
        // Segunda tentativa com o mesmo token — deve lançar
        assertThrows(UnauthorizedException.class,
            () -> authService.refresh(new RefreshTokenRequest(resp.refreshToken())));
    }

    @Test
    void forgotPassword_emailNaoExiste_naoLancaExcecao() {
        // Deve ser silencioso (não revelar se email existe)
        assertDoesNotThrow(
            () -> authService.forgotPassword(new ForgotPasswordRequest("naoexiste@test.com")));
    }

    @Test
    void forgotPassword_emailExistente_naoLancaExcecao() {
        authService.register(new RegisterRequest("forgot.as@test.com", "Pass@1234", Role.EXECUTIVE));
        assertDoesNotThrow(
            () -> authService.forgotPassword(new ForgotPasswordRequest("forgot.as@test.com")));
    }

    @Test
    void resetPassword_tokenInvalido_lancaInvalidRequestException() {
        assertThrows(InvalidRequestException.class,
            () -> authService.resetPassword(new ResetPasswordRequest("token-invalido", "NovaSenha@1")));
    }
}
