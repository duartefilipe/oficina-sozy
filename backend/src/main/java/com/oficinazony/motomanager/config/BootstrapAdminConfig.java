package com.oficinazony.motomanager.config;

import com.oficinazony.motomanager.domain.entity.AppUser;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapAdminConfig {

    @Bean
    CommandLineRunner createDefaultSuperAdmin(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.superadmin.username:superadmin}") String username,
            @Value("${app.bootstrap.superadmin.password:superadmin123}") String password,
            @Value("${app.bootstrap.superadmin.nome:Super Admin}") String nome
    ) {
        return args -> {
            if (appUserRepository.findByUsername(username).isEmpty()) {
                AppUser user = new AppUser();
                user.setUsername(username);
                user.setNome(nome);
                user.setRole(UserRole.SUPERADMIN);
                user.setPasswordHash(passwordEncoder.encode(password));
                user.setAtivo(true);
                appUserRepository.save(user);
            }
        };
    }
}
