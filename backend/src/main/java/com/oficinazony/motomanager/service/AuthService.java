package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.auth.LoginRequest;
import com.oficinazony.motomanager.api.dto.auth.LoginResponse;
import com.oficinazony.motomanager.api.dto.auth.MeResponse;
import com.oficinazony.motomanager.domain.entity.AppUser;
import com.oficinazony.motomanager.repository.AppUserRepository;
import com.oficinazony.motomanager.security.JwtService;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthContextService authContextService;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthContextService authContextService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authContextService = authContextService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
        }

        String token = jwtService.generate(new SecurityUser(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getRole(),
                user.getOficina() != null ? user.getOficina().getId() : null,
                Boolean.TRUE.equals(user.getAtivo())
        ));
        return new LoginResponse(
                token,
                user.getId(),
                user.getNome(),
                user.getUsername(),
                user.getRole(),
                user.getOficina() != null ? user.getOficina().getId() : null,
                user.getOficina() != null ? user.getOficina().getNome() : null
        );
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        SecurityUser current = authContextService.currentUser();
        AppUser user = appUserRepository.findById(current.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao encontrado"));
        return new MeResponse(
                user.getId(),
                user.getNome(),
                user.getUsername(),
                user.getRole(),
                user.getOficina() != null ? user.getOficina().getId() : null,
                user.getOficina() != null ? user.getOficina().getNome() : null
        );
    }
}
