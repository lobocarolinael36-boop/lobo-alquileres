package com.loboalquileres.controller;

import com.loboalquileres.dto.request.LoginRequest;
import com.loboalquileres.dto.response.AuthResponse;
import com.loboalquileres.entity.Usuario;
import com.loboalquileres.repository.UsuarioRepository;
import com.loboalquileres.security.JwtTokenProvider;
import com.loboalquileres.security.LoginAttemptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Login y gestión de tokens JWT")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider      jwtTokenProvider;
    private final UsuarioRepository     usuarioRepository;
    private final LoginAttemptService   loginAttemptService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Devuelve un JWT válido por 24 horas")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {

        // ── Protección brute-force ────────────────────────────────────────────
        if (loginAttemptService.estaBloqueado(request.username())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                    "error", "Cuenta temporalmente bloqueada por múltiples intentos fallidos.",
                    "mensaje", "Intentá de nuevo en 15 minutos."
                ));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            loginAttemptService.loginExitoso(request.username());

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Obtener tenantSchema del usuario
            Usuario usuario = usuarioRepository.findByUsernameAndActivoTrue(request.username())
                .orElse(null);
            String tenantSchema = usuario != null ? usuario.getTenantSchema() : null;

            String token = jwtTokenProvider.generateToken(userDetails, tenantSchema);

            // Registrar último login
            if (usuario != null) {
                usuario.setUltimoLogin(OffsetDateTime.now());
                usuarioRepository.save(usuario);
            }

            String rol = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("AGENTE");

            return ResponseEntity.ok(new AuthResponse(
                token,
                "Bearer",
                jwtTokenProvider.getExpirationMs(),
                userDetails.getUsername(),
                rol,
                tenantSchema
            ));

        } catch (BadCredentialsException e) {
            loginAttemptService.loginFallido(request.username());
            int restantes = loginAttemptService.intentosRestantes(request.username());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "error", "Credenciales incorrectas.",
                    "intentosRestantes", restantes
                ));
        }
    }
}
