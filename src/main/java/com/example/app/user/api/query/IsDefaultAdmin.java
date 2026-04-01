package com.example.app.user.api.query;

import com.example.app.user.api.Email;
import com.example.app.user.authentication.RequiresRole;
import com.example.app.user.authentication.Role;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.Request;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

import java.util.Arrays;
import java.util.List;

import static io.fluxzero.sdk.configuration.ApplicationProperties.getProperty;

@Value
@RequiresRole(Role.admin)
public class IsDefaultAdmin implements Request<Boolean> {
    static List<Email> defaultAdmins() {
        return Fluxzero.get().cache().computeIfAbsent("IsDefaultAdmin", k -> Arrays.stream(
                        getProperty("default-admins", "").split(","))
                .map(String::trim).filter(s -> !s.isBlank()).map(Email::new).toList());
    }

    @NotNull @Valid Email email;

    @HandleQuery
    boolean handle() {
        return defaultAdmins().contains(email);
    }
}
