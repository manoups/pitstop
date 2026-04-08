package com.example.app.pitstop.api;

import jakarta.validation.constraints.NotBlank;

public record Vehicle(@NotBlank String licensePlateNumber, String make, String model, String year, String color) {
}
