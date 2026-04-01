package com.example.app.refdata.rdw;

import com.example.app.pitstop.api.Vehicle;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.fluxzero.common.serialization.JsonUtils;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Value
public class RdwVehicle {
    @JsonAlias("kenteken")
    String licensePlateNumber;
    @JsonAlias("merk")
    String make;
    @JsonAlias("handelsbenaming")
    String model;
    @JsonProperty("datum_eerste_toelating_dt")
    LocalDateTime firstDate;
    @JsonAlias("eerste_kleur")
    String color;

    public String getYear() {
        return Optional.ofNullable(firstDate).map(LocalDateTime::getYear).map(Objects::toString).orElse(null);
    }

    public Vehicle toVehicle() {
        return JsonUtils.convertValue(this, Vehicle.class);
    }
}
