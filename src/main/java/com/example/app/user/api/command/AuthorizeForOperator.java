package com.example.app.user.api.command;

import com.example.app.refdata.api.OperatorId;
import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import com.example.app.user.authentication.RequiresRole;
import com.example.app.user.authentication.Role;
import io.fluxzero.sdk.persisting.eventsourcing.Apply;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

@Value
@RequiresRole(Role.admin)
public class AuthorizeForOperator implements UserUpdate {
    UserId userId;
    @NotNull OperatorId operatorId;

    @Apply
    UserProfile apply(UserProfile userProfile) {
        return userProfile.toBuilder().operator(operatorId).build();
    }

}
