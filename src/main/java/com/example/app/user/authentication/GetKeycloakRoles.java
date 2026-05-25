package com.example.app.user.authentication;

import com.example.app.refdata.api.query.SendWebRequest;
import com.fasterxml.jackson.databind.JsonNode;
import io.fluxzero.sdk.tracking.Consumer;
import io.fluxzero.sdk.tracking.ForeverRetryingErrorHandler;
import io.fluxzero.sdk.tracking.handling.Request;
import io.fluxzero.sdk.web.HttpRequestMethod;
import io.fluxzero.sdk.web.WebRequest;
import io.fluxzero.sdk.web.WebResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.SneakyThrows;
import lombok.Value;

import java.util.HashMap;
import java.util.Map;

import static io.fluxzero.common.api.Metadata.objectMapper;
import static io.fluxzero.sdk.configuration.ApplicationProperties.requireProperty;

@Value
@Consumer(name = "keycloak-consumer", errorHandler = ForeverRetryingErrorHandler.class)
public class GetKeycloakRoles extends SendWebRequest implements Request<Map<String, String>> {
    @NotBlank
    String token;

    @Override
    protected WebRequest.Builder buildRequest(WebRequest.Builder requestBuilder, Sender sender) {
        return requestBuilder
                .url("%s/admin/realms/pitstop/roles".formatted(requireProperty("keycloak.baseUrl")))
                .method(HttpRequestMethod.GET)
                .contentType("application/json")
                .header("Authorization", "Bearer " + token);
    }

    @SneakyThrows
    @Override
    public Map<String, String> handleResponse(WebResponse response, WebRequest request) {
        Object o = super.handleResponse(response, request);
        JsonNode jsonNode = objectMapper.readTree(o.toString());
        Map<String, String> roleMap = new HashMap<>();
        if (jsonNode.isArray()) {
            for (JsonNode node : jsonNode) {
                roleMap.put(node.get("name").asText(), node.get("id").asText());
            }
        }
        return roleMap;
    }
}
