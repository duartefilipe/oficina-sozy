package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.user.UserRequest;
import com.oficinazony.motomanager.api.dto.user.UserResponse;
import com.oficinazony.motomanager.api.dto.user.UserUpdateRequest;
import com.oficinazony.motomanager.domain.entity.AppUser;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.AppUserRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthContextService authContextService;

    public UserService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            AuthContextService authContextService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authContextService = authContextService;
    }

    @Transactional
    public UserResponse criar(UserRequest request) {
        SecurityUser current = authContextService.currentUser();

        if (appUserRepository.findByUsername(request.username()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username ja cadastrado");
        }

        if (current.getRole() == UserRole.ADMIN && request.role() != UserRole.USUARIO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode criar usuario comum");
        }
        if (current.getRole() == UserRole.USUARIO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario comum nao pode criar usuarios");
        }

        AppUser user = new AppUser();
        user.setNome(request.nome());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());

        if (request.role() != UserRole.SUPERADMIN) {
            if (current.getRole() == UserRole.SUPERADMIN && request.role() == UserRole.ADMIN) {
                user.setCreatedByAdmin(null);
            } else if (current.getRole() == UserRole.SUPERADMIN && request.role() == UserRole.USUARIO) {
                if (request.createdByAdminId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe createdByAdminId para usuario comum");
                }
                AppUser admin = appUserRepository.findById(request.createdByAdminId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin informando nao encontrado"));
                if (admin.getRole() != UserRole.ADMIN) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "createdByAdminId deve apontar para um ADMIN");
                }
                user.setCreatedByAdmin(admin);
            } else {
                AppUser admin = appUserRepository.findById(current.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario logado invalido"));
                user.setCreatedByAdmin(admin);
            }
        }

        return toResponse(appUserRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return appUserRepository.findAll().stream().map(this::toResponse).toList();
        }
        if (current.getRole() == UserRole.ADMIN) {
            AppUser self = appUserRepository.findById(current.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario logado invalido"));
            List<UserResponse> meus = appUserRepository.findByCreatedByAdminId(current.getId()).stream().map(this::toResponse).toList();
            return java.util.stream.Stream.concat(java.util.stream.Stream.of(toResponse(self)), meus.stream()).toList();
        }
        AppUser self = appUserRepository.findById(current.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario logado invalido"));
        return List.of(toResponse(self));
    }

    @Transactional
    public void remover(Integer userId) {
        SecurityUser current = authContextService.currentUser();
        AppUser target = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        if (current.getRole() == UserRole.SUPERADMIN) {
            if (target.getRole() == UserRole.SUPERADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nao e permitido remover superadmin");
            }
            appUserRepository.delete(target);
            return;
        }

        if (current.getRole() == UserRole.ADMIN) {
            if (target.getCreatedByAdmin() == null || !target.getCreatedByAdmin().getId().equals(current.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode remover usuarios do proprio grupo");
            }
            if (target.getRole() != UserRole.USUARIO) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode remover usuario comum");
            }
            appUserRepository.delete(target);
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario comum nao pode remover usuarios");
    }

    @Transactional
    public UserResponse atualizar(Integer userId, UserUpdateRequest request) {
        SecurityUser current = authContextService.currentUser();
        AppUser target = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        appUserRepository.findByUsername(request.username())
                .filter(found -> !found.getId().equals(userId))
                .ifPresent(found -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username ja cadastrado");
                });

        if (current.getRole() == UserRole.SUPERADMIN) {
            if (target.getRole() == UserRole.SUPERADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nao e permitido editar superadmin");
            }
            aplicarAtualizacao(target, request, current);
            return toResponse(appUserRepository.save(target));
        }

        if (current.getRole() == UserRole.ADMIN) {
            if (target.getRole() != UserRole.USUARIO) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode editar usuario comum");
            }
            if (target.getCreatedByAdmin() == null || !target.getCreatedByAdmin().getId().equals(current.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode editar usuarios do proprio grupo");
            }
            if (request.role() != UserRole.USUARIO) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin nao pode alterar perfil para ADMIN/SUPERADMIN");
            }
            target.setNome(request.nome());
            target.setUsername(request.username());
            target.setAtivo(request.ativo());
            if (request.password() != null && !request.password().isBlank()) {
                target.setPasswordHash(passwordEncoder.encode(request.password()));
            }
            return toResponse(appUserRepository.save(target));
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario comum nao pode editar usuarios");
    }

    private void aplicarAtualizacao(AppUser target, UserUpdateRequest request, SecurityUser current) {
        target.setNome(request.nome());
        target.setUsername(request.username());
        target.setRole(request.role());
        target.setAtivo(request.ativo());

        if (request.password() != null && !request.password().isBlank()) {
            target.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        if (request.role() == UserRole.SUPERADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nao e permitido promover para superadmin");
        }

        if (request.role() == UserRole.ADMIN) {
            target.setCreatedByAdmin(null);
            return;
        }

        Integer adminId = request.createdByAdminId();
        if (current.getRole() == UserRole.SUPERADMIN) {
            if (adminId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe createdByAdminId para usuario comum");
            }
            AppUser admin = appUserRepository.findById(adminId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin informando nao encontrado"));
            if (admin.getRole() != UserRole.ADMIN) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "createdByAdminId deve apontar para um ADMIN");
            }
            target.setCreatedByAdmin(admin);
            return;
        }

        AppUser admin = appUserRepository.findById(current.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario logado invalido"));
        target.setCreatedByAdmin(admin);
    }

    private UserResponse toResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getNome(),
                user.getUsername(),
                user.getRole(),
                user.getCreatedByAdmin() != null ? user.getCreatedByAdmin().getId() : null,
                user.getAtivo()
        );
    }
}
