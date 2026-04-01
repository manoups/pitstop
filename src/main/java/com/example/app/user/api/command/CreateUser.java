package com.example.app.user.api.command;

import com.example.app.user.api.UserDetails;
import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import com.example.app.user.authentication.RequiresRole;
import com.example.app.user.authentication.Role;
import io.fluxzero.sdk.persisting.eventsourcing.Apply;
import io.fluxzero.sdk.tracking.handling.IllegalCommandException;
import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

@Value
@RequiresRole(Role.admin)
public class CreateUser implements UserUpdate {
    @NotNull
    UserId userId;
    @NotNull @Valid
    UserDetails details;
    Role role;

    @Override
    public void assertExistence(@Nullable UserProfile profile) {
        if (profile != null) {
            throw new IllegalCommandException("User already exists");
        }
    }

    @Apply
    UserProfile apply() {
        return UserProfile.builder().userId(userId).details(details).userRole(role).build();
    }
}
