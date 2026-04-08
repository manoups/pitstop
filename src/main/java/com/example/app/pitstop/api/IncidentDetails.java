package com.example.app.pitstop.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record IncidentDetails(@NotNull @Valid GeoLocation location, @NotNull @Valid Vehicle vehicle,
                              String description) {
}
