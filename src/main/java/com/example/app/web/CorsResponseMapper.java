package com.example.app.web;

import io.fluxzero.common.api.Metadata;
import io.fluxzero.sdk.common.serialization.DeserializingMessage;
import io.fluxzero.sdk.web.DefaultWebResponseMapper;
import io.fluxzero.sdk.web.WebRequest;
import io.fluxzero.sdk.web.WebResponse;
import io.fluxzero.sdk.web.WebResponseMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class CorsResponseMapper implements WebResponseMapper {
    private final WebResponseMapper defaultMapper = new DefaultWebResponseMapper();

    @Override
    public WebResponse map(Object payload, Metadata metadata) {
        var result = defaultMapper.map(payload, metadata);
        if (payload instanceof Throwable) {
            Map<String, List<String>> headers = new LinkedHashMap<>(result.getHeaders());
            headers.remove("Content-Type");
            result = result.withPayload(Map.of("error", result.getPayload())).addMetadata("headers", headers);
        }
        return addAllowOriginHeader(result);
    }

    private static WebResponse addAllowOriginHeader(WebResponse result) {
        DeserializingMessage request = DeserializingMessage.getCurrent();
        if (request == null) {
            log.warn("WebRequest not found. May give issues for CORS headers.");
            return result;
        }
        var originHeaders =
                WebRequest.getHeaders(request.getMetadata()).getOrDefault("Origin", Collections.emptyList());
        if (!originHeaders.isEmpty()) {
            return result.toBuilder()
                    .header("Access-Control-Allow-Credentials", "true")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Encoding, X-Impersonation")
                    .header("Access-Control-Allow-Origin", originHeaders.stream().findFirst()
                            .filter(o -> o.endsWith(".flux.host")
                                         || o.startsWith("http://localhost:4200"))
                            .orElse("https://flux.host")).build();
        }
        return result;
    }

}
