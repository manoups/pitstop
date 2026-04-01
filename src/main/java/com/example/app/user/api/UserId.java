package com.example.app.user.api;

import io.fluxzero.sdk.modeling.Id;

public class UserId extends Id<UserProfile> {
    public UserId(String functionalId) {
        super(functionalId);
    }
}
