package com.example.app.refdata.api;

import io.fluxzero.sdk.modeling.Aggregate;
import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
@Aggregate(searchable = true)
public class Operator {
    OperatorId operatorId;
    OperatorDetails details;
}
