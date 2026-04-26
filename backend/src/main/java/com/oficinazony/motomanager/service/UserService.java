package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.user.UserRequest;
import com.oficinazony.motomanager.api.dto.user.UserResponse;
import com.oficinazony.motomanager.api.dto.user.UserUpdateRequest;
import com.oficinazony.motomanager.domain.entity.AppUser;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.AppUserRepository;
import com.oficinazony.motomanager.repository.OficinaRepository;
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
    private final OficinaRepository oficinaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthContextService authContextService;

    public UserService(
            AppUserRepository appUserRepository,
            OficinaRepository oficinaRepository,
            PasswordEncoder passwordEncoder,
            AuthContextService authContextService
    ) {
        this.appUserRepository = appUserRepository;
        this.oficinaRepository = oficinaRepository;
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
        user.setRole(current.getRole() == UserRole.ADMIN ? UserRole.USUARIO : request.role());
        user.setOficina(resolveOficinaParaCriacao(current, request.role(), request.oficinaId()));

        if (user.getRole() == UserRole.USUARIO && current.getRole() == UserRole.ADMIN) {
            AppUser admin = appUserRepository.findById(current.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario logado invalido"));
            user.setCreatedByAdmin(admin);
        } else {
            user.setCreatedByAdmin(null);
        }

        return toResponse(appUserRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return appUserRepository.findAll().stream().map(this::toResponse).toList();
        }
        if (current.getOficinaId() == null) {
            return List.of();
        }
        return appUserRepository.findByOficinaId(current.getOficinaId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void remover(Integer userId) {
        SecurityUser current = authContextService.currentUser();
        AppUser target = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        if (current.getRole() == UserRole.SUPERADMIN) {
            if (target.getId().equals(current.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nao e permitido remover o proprio usuario");
            }
            appUserRepository.delete(target);
            return;
        }

        if (current.getRole() == UserRole.ADMIN) {
            if (target.getRole() != UserRole.USUARIO) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode remover usuario comum");
            }
            validarMesmaOficina(current, target);
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
            aplicarAtualizacao(target, request, current);
            return toResponse(appUserRepository.save(target));
        }

        if (current.getRole() == UserRole.ADMIN) {
            if (target.getRole() != UserRole.USUARIO) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin so pode editar usuario comum");
            }
            validarMesmaOficina(current, target);
            if (request.role() != UserRole.USUARIO) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin nao pode alterar perfil para ADMIN/SUPERADMIN");
            }
            target.setNome(request.nome());
            target.setUsername(request.username());
            target.setAtivo(request.ativo());
            target.setOficina(resolveOficinaParaAtualizacao(current, target, request.role(), request.oficinaId()));
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
        target.setOficina(resolveOficinaParaAtualizacao(current, target, request.role(), request.oficinaId()));

        if (request.password() != null && !request.password().isBlank()) {
            target.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        if (request.role() == UserRole.SUPERADMIN) {
            target.setCreatedByAdmin(null);
            target.setOficina(null);
            return;
        }

        if (request.role() == UserRole.ADMIN) {
            target.setCreatedByAdmin(null);
            return;
        }

        if (current.getRole() == UserRole.SUPERADMIN) {
            target.setCreatedByAdmin(null);
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
                user.getOficina() != null ? user.getOficina().getId() : null,
                user.getOficina() != null ? user.getOficina().getNome() : null,
                user.getAtivo()
        );
    }

    private Oficina resolveOficinaParaCriacao(SecurityUser current, UserRole role, Integer oficinaId) {
        if (role == UserRole.SUPERADMIN) {
            return null;
        }
        if (current.getRole() == UserRole.ADMIN) {
            if (current.getOficinaId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin sem oficina vinculada");
            }
            return findOficina(current.getOficinaId());
        }
        if (oficinaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe oficinaId");
        }
        return findOficina(oficinaId);
    }

    private Oficina resolveOficinaParaAtualizacao(SecurityUser current, AppUser target, UserRole role, Integer oficinaId) {
        if (role == UserRole.SUPERADMIN) {
            return null;
        }
        if (current.getRole() == UserRole.ADMIN) {
            if (current.getOficinaId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin sem oficina vinculada");
            }
            return findOficina(current.getOficinaId());
        }
        if (oficinaId != null) {
            return findOficina(oficinaId);
        }
        if (target.getOficina() != null) {
            return target.getOficina();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe oficinaId");
    }

    private Oficina findOficina(Integer oficinaId) {
        return oficinaRepository.findById(oficinaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oficina nao encontrada"));
    }

    private void validarMesmaOficina(SecurityUser current, AppUser target) {
        if (current.getOficinaId() == null || target.getOficina() == null || !current.getOficinaId().equals(target.getOficina().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para usuario de outra oficina");
        }
    }
}
