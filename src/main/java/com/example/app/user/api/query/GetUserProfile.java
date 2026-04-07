package com.example.app.user.api.query;

import com.example.app.user.api.UserProfile;
import com.example.app.user.authentication.Sender;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.Request;
import jakarta.annotation.Nullable;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;

@Value
@Slf4j
public class GetUserProfile implements Request<UserProfile> {

    @HandleQuery
    UserProfile handle(@Nullable Sender sender) {
        log.info("Getting user profile for {}", sender);
        return sender == null ? null : Fluxzero.loadAggregate(sender.getUserId()).get();
    }
}
