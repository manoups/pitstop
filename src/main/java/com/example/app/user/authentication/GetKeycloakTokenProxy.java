package com.example.app.user.authentication;

import com.example.app.refdata.api.query.SendWebRequest;
import io.fluxzero.sdk.tracking.Consumer;
import io.fluxzero.sdk.tracking.ForeverRetryingErrorHandler;
import io.fluxzero.sdk.tracking.handling.Request;
import io.fluxzero.sdk.web.HttpRequestMethod;
import io.fluxzero.sdk.web.WebRequest;
import io.fluxzero.sdk.web.WebResponse;
import lombok.SneakyThrows;

import static io.fluxzero.common.api.Metadata.objectMapper;
import static io.fluxzero.sdk.configuration.ApplicationProperties.requireProperty;

@Consumer(name = "keycloak-consumer", errorHandler = ForeverRetryingErrorHandler.class)
public class GetKeycloakTokenProxy extends SendWebRequest implements Request<String> {
    @Override
    protected WebRequest.Builder buildRequest(WebRequest.Builder requestBuilder, Sender sender) {
        String body = "grant_type=client_credentials"
                + "&client_id=" +requireProperty("keycloak.clientId")
                + "&client_secret=" + requireProperty("keycloak.clientSecret");
        return requestBuilder
                .acceptGzipEncoding(false)
                .url("%s/realms/%s/protocol/openid-connect/token".formatted(requireProperty("keycloak.baseUrl"), requireProperty("keycloak.realm")))
                .method(HttpRequestMethod.POST)
                .contentType("application/x-www-form-urlencoded")
                .body(body);
    }

    @SneakyThrows
    @Override
    protected String handleResponse(WebResponse response, WebRequest request) {
        Object responseBody = super.handleResponse(response, request);
        return objectMapper.readTree(responseBody.toString()).get("access_token").asText();
    }

}
