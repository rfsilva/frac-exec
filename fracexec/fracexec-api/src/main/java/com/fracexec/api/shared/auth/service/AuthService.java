package com.fracexec.api.shared.auth.service;

import com.fracexec.api.shared.auth.dto.AuthResponse;
import com.fracexec.api.shared.auth.dto.ForgotPasswordRequest;
import com.fracexec.api.shared.auth.dto.LoginRequest;
import com.fracexec.api.shared.auth.dto.RefreshTokenRequest;
import com.fracexec.api.shared.auth.dto.RegisterRequest;
import com.fracexec.api.shared.auth.dto.ResetPasswordRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
