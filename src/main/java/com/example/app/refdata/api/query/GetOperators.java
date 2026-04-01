package com.example.app.refdata.api.query;

import com.example.app.refdata.api.Operator;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.Request;
import lombok.Value;

import java.util.List;

@Value
public class GetOperators implements Request<List<Operator>> {
    @HandleQuery
    List<Operator> handle() {
        return Fluxzero.search(Operator.class).fetchAll();
    }
}
