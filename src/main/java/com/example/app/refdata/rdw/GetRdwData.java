package com.example.app.refdata.rdw;

import com.example.app.refdata.api.query.SendWebRequest;
import com.example.app.user.authentication.Sender;
import io.fluxzero.sdk.configuration.ApplicationProperties;
import io.fluxzero.sdk.tracking.handling.Request;
import io.fluxzero.sdk.web.HttpRequestMethod;
import io.fluxzero.sdk.web.WebRequest;
import lombok.Value;

@Value
public class GetRdwData extends SendWebRequest implements Request<String> {
    String resourcePath;

    @Override
    protected WebRequest.Builder buildRequest(WebRequest.Builder requestBuilder, Sender sender) {
        return requestBuilder
                .url(ApplicationProperties.requireProperty("rdw.domain") + resourcePath)
                .method(HttpRequestMethod.GET)
                .header("X-App-Token", ApplicationProperties.requireProperty("rdw.token"));
    }
}
