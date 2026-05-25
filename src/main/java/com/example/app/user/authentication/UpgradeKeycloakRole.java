package com.example.app.user.authentication;

import com.example.app.refdata.api.query.SendWebRequest;
import io.fluxzero.sdk.tracking.Consumer;
import io.fluxzero.sdk.tracking.ForeverRetryingErrorHandler;
import io.fluxzero.sdk.tracking.handling.Request;
import io.fluxzero.sdk.web.WebRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Value;

import java.util.List;

@Value
@Consumer(name = "keycloak-consumer", errorHandler = ForeverRetryingErrorHandler.class)
public class UpgradeKeycloakRole extends SendWebRequest implements Request<String> {
    @NotBlank
    String token;
    @Valid
    RoleDescriptorDTO role;
    @NotBlank
    String userId;

    @Override
    protected WebRequest.Builder buildRequest(WebRequest.Builder requestBuilder, Sender sender) {
        return requestBuilder.url("%s/admin/realms/%s/users/%s/role-mappings/realm")
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(List.of(role));
    }

}
