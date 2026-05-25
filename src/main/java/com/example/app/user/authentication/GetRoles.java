package com.example.app.user.authentication;

import io.fluxzero.common.MemoizingSupplier;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.common.ClientUtils;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.Request;

import java.util.Map;

public class GetRoles implements Request<Map<String, String>> {
    MemoizingSupplier<Map<String, String>> memoizedRoles = ClientUtils.memoize(this::initializeRoles);

    @HandleQuery
    Map<String, String> roles() {
        return memoizedRoles.get();
    }

    Map<String, String> initializeRoles() {
        String token = Fluxzero.queryAndWait(new GetKeycloakToken());
        return Fluxzero.queryAndWait(new GetKeycloakRoles(token));
    }
}
