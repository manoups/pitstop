package com.example.app.user.authentication;

import jakarta.validation.constraints.NotBlank;

public record RoleDescriptorDTO(@NotBlank String id, @NotBlank String name) {
}
