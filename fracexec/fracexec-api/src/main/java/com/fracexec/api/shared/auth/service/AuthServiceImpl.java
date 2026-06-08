package com.fracexec.api.shared.auth.service;

import com.fracexec.api.company.Company;
import com.fracexec.api.company.CompanyRepository;
import com.fracexec.api.company.CompanyStatus;
import com.fracexec.api.shared.auth.dto.AuthResponse;
import com.fracexec.api.shared.auth.dto.ForgotPasswordRequest;
import com.fracexec.api.shared.auth.dto.LoginRequest;
import com.fracexec.api.shared.auth.dto.RefreshTokenRequest;
import com.fracexec.api.shared.auth.dto.RegisterRequest;
import com.fracexec.api.shared.auth.dto.ResetPasswordRequest;
import com.fracexec.api.shared.auth.model.PasswordResetToken;
import com.fracexec.api.shared.auth.model.RefreshToken;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.PasswordResetTokenRepository;
import com.fracexec.api.shared.auth.repository.RefreshTokenRepository;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ForbiddenException;
import com.fracexec.api.shared.exception.InvalidRequestException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;
    private final CompanyRepository companyRepository;

    @Value("${fracexec.jwt.refresh-token-expiration-days}")
    private int refreshTokenExpirationDays;

    @Value("${fracexec.app.base-url:${FRONTEND_URL:http://localhost:4200}}")
    private String appBaseUrl;

    public AuthServiceImpl(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuthenticationManager authenticationManager,
            JavaMailSender mailSender,
            CompanyRepository companyRepository) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.mailSender = mailSender;
        this.companyRepository = companyRepository;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new InvalidRequestException("Role ADMIN não pode ser registrado via endpoint público.");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Este e-mail já está em uso.");
        }
        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.role());
        userRepository.save(user);
        log.info("Novo usuário registrado com ID [{}] e role [{}]", user.getId(), user.getRole());
        return new AuthResponse(jwtUtil.generateAccessToken(user), createRefreshToken(user), user.getRole().name(), user.getEmail());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // PME com empresa em PENDING_ACTIVATION não pode receber JWT
        if (user.getRole() == Role.PME) {
            Company company = companyRepository.findByUser(user).orElse(null);
            if (company != null && company.getStatus() == CompanyStatus.PENDING_ACTIVATION) {
                throw new ForbiddenException(
                    "Seu cadastro está em análise. Você receberá um e-mail quando o acesso for ativado.");
            }
        }

        log.info("Login realizado para ID [{}]", user.getId());
        return new AuthResponse(jwtUtil.generateAccessToken(user), createRefreshToken(user), user.getRole().name(), user.getEmail());
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenHash = hashToken(request.refreshToken());
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new UnauthorizedException("Refresh token inválido ou expirado."));
        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            throw new UnauthorizedException("Refresh token inválido ou expirado.");
        }
        User user = refreshToken.getUser();
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);
        String newRawRefreshToken = createRefreshToken(user);
        return new AuthResponse(jwtUtil.generateAccessToken(user), newRawRefreshToken, user.getRole().name(), user.getEmail());
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            passwordResetTokenRepository.invalidatePriorTokensByUserId(user.getId());
            String rawToken = UUID.randomUUID().toString();
            Instant expiresAt = Instant.now().plus(1, ChronoUnit.HOURS);
            passwordResetTokenRepository.save(new PasswordResetToken(user, hashToken(rawToken), expiresAt));
            sendPasswordResetEmail(request.email(), appBaseUrl + "/reset-password?token=" + rawToken);
            log.info("Link de redefinição gerado para ID [{}]", user.getId());
        });
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashToken(request.token()))
            .orElseThrow(() -> new InvalidRequestException("Link de redefinição inválido ou expirado. Solicite um novo."));
        if (resetToken.isExpiredOrUsed()) {
            throw new InvalidRequestException("Link de redefinição inválido ou expirado. Solicite um novo.");
        }
        User user = userRepository.findById(resetToken.getUser().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        userRepository.updatePasswordHash(user.getId(), passwordEncoder.encode(request.newPassword()));
        resetToken.markUsed();
        passwordResetTokenRepository.save(resetToken);
        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("Senha redefinida para ID [{}]; refresh tokens revogados", user.getId());
    }

    private String createRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS);
        refreshTokenRepository.save(new RefreshToken(user, hashToken(rawToken), expiresAt));
        return rawToken;
    }

    private String hashToken(String rawToken) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private void sendPasswordResetEmail(String toEmail, String resetLink) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("Redefinição de senha — FracExec");
            msg.setText("Olá,\n\nClique no link para redefinir sua senha (válido por 1 hora):\n" + resetLink + "\n\nEquipe FracExec");
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail de redefinição: {}", e.getClass().getSimpleName());
        }
    }
}
