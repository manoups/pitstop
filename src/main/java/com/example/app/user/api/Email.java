package com.example.app.user.api;

import com.fasterxml.jackson.annotation.JsonValue;
import io.fluxzero.common.search.Facet;

import java.util.Objects;

@Facet
public final class Email {
    @JsonValue
    private final @jakarta.validation.constraints.Email String value;

    public Email(String value) {
        this.value = value == null ? null : value.trim().toLowerCase();
    }

    @Override
    public String toString() {
        return value;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (object == null || getClass() != object.getClass()) {
            return false;
        }
        Email email = (Email) object;
        return Objects.equals(value, email.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }
}
