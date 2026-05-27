package com.example.app.user.authentication;

import io.fluxzero.common.MemoizingSupplier;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.common.ClientUtils;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.Request;

import java.time.Duration;

public class GetKeycloakToken implements Request<String> {
    MemoizingSupplier<String> memoizedToken = ClientUtils.memoize(this::fetchToken, Duration.ofSeconds(300));

    private String fetchToken() {
        return Fluxzero.queryAndWait(new GetKeycloakTokenProxy());
    }

    @HandleQuery
    String token() {
        return memoizedToken.get();
    }
}
