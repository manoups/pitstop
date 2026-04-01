package com.example.app.user.api.command;

import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.modeling.AssertLegal;
import io.fluxzero.sdk.tracking.TrackSelf;
import io.fluxzero.sdk.tracking.handling.HandleCommand;
import io.fluxzero.sdk.tracking.handling.IllegalCommandException;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;

@TrackSelf
public interface UserUpdate {
    @NotNull
    UserId getUserId();

    @AssertLegal
    default void assertExistence(@Nullable UserProfile profile) {
        if (profile == null) {
            throw new IllegalCommandException("User not found");
        }
    }

    @HandleCommand
    default void handle() {
        Fluxzero.loadAggregate(getUserId()).assertAndApply(this);
    }
}
