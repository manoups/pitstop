package com.example.app.refdata.api.command;

import com.example.app.refdata.api.Operator;
import com.example.app.refdata.api.OperatorDetails;
import com.example.app.refdata.api.OperatorId;
import com.example.app.user.api.UserId;
import com.example.app.user.api.command.AuthorizeForOperator;
import com.example.app.user.authentication.Sender;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.modeling.AssertLegal;
import io.fluxzero.sdk.persisting.eventsourcing.Apply;
import io.fluxzero.sdk.tracking.handling.HandleCommand;
import io.fluxzero.sdk.tracking.handling.IllegalCommandException;
import io.fluxzero.sdk.tracking.handling.Request;
import io.fluxzero.sdk.tracking.handling.authentication.RequiresUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

import static io.fluxzero.sdk.common.Message.asMessage;

@Value
@RequiresUser
public class RegisterOperator implements Request<OperatorId> {
    @NotNull
    OperatorId operatorId = OperatorId.createNew();
    @NotNull @Valid
    OperatorDetails details;
    UserId owner;

    @HandleCommand
    OperatorId handle() {
        Fluxzero.loadAggregate(getOperatorId()).assertAndApply(this);
        return getOperatorId();
    }

    @AssertLegal
    void assertAuthorizedForOwner(Sender sender) {
        if (owner != null && !sender.isAuthorizedFor(owner)) {
            throw new IllegalCommandException("Sender is not authorized for given owner");
        }
    }

    @Apply
    Operator create() {
        if (owner != null) {
            Fluxzero.loadAggregate(owner).assertAndApply(
                    asMessage(new AuthorizeForOperator(owner, operatorId)).addUser(Sender.system));
        }
        return Operator.builder().operatorId(operatorId).details(details).build();
    }
}
