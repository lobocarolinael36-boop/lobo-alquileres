package com.loboalquileres.security;

import com.loboalquileres.entity.Usuario;
import com.loboalquileres.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    // @Transactional(readOnly=true): se necesita una transacción activa aunque
    // sea solo lectura, porque Spring Security llama a este método fuera de
    // cualquier transacción existente.
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsernameAndActivoTrue(username)
            .orElseThrow(() -> new UsernameNotFoundException(
                "Usuario no encontrado o inactivo: " + username
            ));

        // Construimos un UserDetails estándar de Spring Security.
        // "ROLE_" es el prefijo que Spring Security espera para los roles.
        return User.builder()
            .username(usuario.getUsername())
            .password(usuario.getPasswordHash())
            .roles(usuario.getRol().name())   // → "ROLE_ADMIN", "ROLE_MARTILLERO", etc.
            .build();
    }
}
