package com.example.app.user.authentication;

import com.example.app.refdata.api.OperatorId;
import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.tracking.handling.authentication.User;
import lombok.Builder;
import lombok.NonNull;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

@Value
@Builder(toBuilder = true)
@Slf4j
public class Sender implements User {

    public static final Sender system = builder()
            .userId(new UserId("system")).userRole(Role.admin).build();

    public static Sender getCurrent() {
        return User.getCurrent();
    }

    public static Sender createSender(UserId userId) {
        UserProfile userProfile = Fluxzero.loadAggregate(userId).get();
        if (userProfile == null) {
            log.info("User {} does not exist", userId);
            return null;
        }
        return createSender(userProfile);
    }

    public static Sender createSender(UserProfile userProfile) {
        return Sender.builder().userId(userProfile.getUserId()).userRole(userProfile.getUserRole())
                .operator(userProfile.getOperator()).build();
    }

    @NonNull UserId userId;
    Role userRole;
    OperatorId operator;

    @Override
    @JsonIgnore
    public String getName() {
        return userId.getFunctionalId();
    }

    public boolean hasRole(Role role) {
        return role.matches(userRole);
    }

    @Override
    public boolean hasRole(String role) {
        return hasRole(Role.valueOf(role));
    }

    public boolean isAdmin() {
        return Role.admin.matches(userRole);
    }

    public boolean isAuthorizedFor(OperatorId operatorId) {
        return isAdmin() || Objects.equals(operatorId, this.operator);
    }

    public boolean isAuthorizedFor(UserId userId) {
        return isAdmin() || Objects.equals(userId, this.userId);
    }
}
