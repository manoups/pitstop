package com.example.app.user.api.query;

import com.example.app.user.api.UserProfile;
import com.example.app.user.authentication.Sender;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.Request;
import jakarta.annotation.Nullable;
import lombok.Value;

@Value
public class GetUserProfile implements Request<UserProfile> {

    @HandleQuery
    UserProfile handle(@Nullable Sender sender) {
        return sender == null ? null : Fluxzero.loadAggregate(sender.getUserId()).get();
    }
}
