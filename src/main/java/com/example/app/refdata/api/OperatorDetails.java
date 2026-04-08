package com.example.app.refdata.api;

import jakarta.validation.constraints.NotBlank;

public record OperatorDetails(@NotBlank String name) {
}
