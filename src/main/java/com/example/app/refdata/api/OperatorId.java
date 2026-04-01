package com.example.app.refdata.api;

import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.modeling.Id;

public class OperatorId extends Id<Operator> {
    public static OperatorId createNew() {
        return new OperatorId(Fluxzero.generateId());
    }

    public OperatorId(String id) { super(id);}
}
