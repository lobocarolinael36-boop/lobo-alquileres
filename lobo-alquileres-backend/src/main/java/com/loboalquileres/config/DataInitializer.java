package com.loboalquileres.config;

import com.loboalquileres.entity.Usuario;
import com.loboalquileres.enums.RolUsuario;
import com.loboalquileres.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea el usuario SUPERADMIN al iniciar si no existe.
 * Es idempotente: si ya existe no hace nada.
 * Contraseña inicial: Caro1234 — cambiala después del primer login.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder   passwordEncoder;

    @Override
    public void run(String... args) {
        crearSuperAdminSiNoExiste();
    }

    private void crearSuperAdminSiNoExiste() {
        if (usuarioRepository.existsByUsernameOrEmail("admin", "admin@loboalquileres.com")) {
            log.info("Usuario superadmin ya existe.");
            return;
        }

        Usuario superAdmin = Usuario.builder()
            .username("admin")
            .passwordHash(passwordEncoder.encode("Caro1234"))
            .email("admin@loboalquileres.com")
            .rol(RolUsuario.SUPERADMIN)
            .tenantSchema(null)   // superadmin no pertenece a ningún tenant
            .activo(true)
            .build();

        usuarioRepository.save(superAdmin);

        log.warn("╔══════════════════════════════════════════════╗");
        log.warn("║   SUPERADMIN CREADO                          ║");
        log.warn("║   Username : admin                           ║");
        log.warn("║   Password : Caro1234                        ║");
        log.warn("║   Cambiá la contraseña antes de deploy.      ║");
        log.warn("╚══════════════════════════════════════════════╝");
    }
}
