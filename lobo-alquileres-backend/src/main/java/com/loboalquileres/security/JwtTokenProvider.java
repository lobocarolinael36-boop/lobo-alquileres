package com.loboalquileres.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    // ==========================================================================
    // La clave de firma se deriva del secreto Base64 en cada llamada.
    // Se crea en el método para garantizar que siempre usa el valor
    // inyectado (los @Value se inyectan después del constructor).
    // ==========================================================================
    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    /**
     * Genera un JWT firmado con HMAC-SHA256 (HS256).
     * El subject es el username — lo que se usa para identificar al usuario
     * en cada request sin consultar la base de datos.
     */
    /**
     * Genera un JWT con username, roles y (si aplica) el schema del tenant.
     *
     * @param tenantSchema schema del tenant del usuario, o null para superadmin.
     */
    public String generateToken(UserDetails userDetails, String tenantSchema) {
        Date ahora  = new Date();
        Date expira = new Date(ahora.getTime() + jwtExpirationMs);

        var builder = Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("roles", userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .toList())
            .issuedAt(ahora)
            .expiration(expira);

        if (tenantSchema != null && !tenantSchema.isBlank()) {
            builder.claim("tenantSchema", tenantSchema);
        }

        return builder.signWith(signingKey()).compact();
    }

    /** Extrae el username del token. */
    public String extractUsername(String token) {
        return Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }

    /** Extrae el tenantSchema del token (null si es superadmin). */
    public String extractTenantSchema(String token) {
        try {
            return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("tenantSchema", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Valida firma, formato y expiración del token.
     * Captura todas las variantes de JwtException para devolver false en lugar
     * de propagar una excepción — el filtro maneja el boolean.
     */
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }
}
