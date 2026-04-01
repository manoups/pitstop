package com.example.app.pitstop.api;

import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.modeling.Id;

public class IncidentId extends Id<Incident> {
    public static IncidentId newValue() {
        return new IncidentId(Fluxzero.generateId());
    }

    public IncidentId(String id) { super(id);}
}
