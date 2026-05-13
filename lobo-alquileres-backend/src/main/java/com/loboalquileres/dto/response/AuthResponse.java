package com.loboalquileres.dto.response;

public record AuthResponse(
    String token,
    String tokenType,    // siempre "Bearer"
    long expiresInMs,
    String username,
    String rol,
    String tenantSchema  // null para superadmin
) {}
