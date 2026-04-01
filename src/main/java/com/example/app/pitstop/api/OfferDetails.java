package com.example.app.pitstop.api;

import com.example.app.refdata.api.OperatorId;
import com.example.app.user.authentication.Sender;
import io.fluxzero.sdk.modeling.AssertLegal;
import io.fluxzero.sdk.tracking.handling.IllegalCommandException;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OfferDetails(@NotNull OperatorId operatorId, @NotNull @PositiveOrZero BigDecimal price) {
    @AssertLegal
    void assertAuthorized(Sender sender) {
        if (!sender.isAuthorizedFor(operatorId)) {
            throw new IllegalCommandException("Not authorized for operator");
        }
    }
}
