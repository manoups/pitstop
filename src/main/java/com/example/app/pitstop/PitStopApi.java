package com.example.app.pitstop;

import com.example.app.pitstop.api.Incident;
import com.example.app.pitstop.api.IncidentDetails;
import com.example.app.pitstop.api.IncidentId;
import com.example.app.pitstop.api.OfferDetails;
import com.example.app.pitstop.api.OfferId;
import io.fluxzero.sdk.tracking.handling.IllegalCommandException;
import io.fluxzero.sdk.web.HandleGet;
import io.fluxzero.sdk.web.HandleOptions;
import io.fluxzero.sdk.web.HandlePost;
import io.fluxzero.sdk.web.Path;
import io.fluxzero.sdk.web.PathParam;
import io.fluxzero.sdk.web.WebResponse;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
@Path("/api")
public class PitStopApi {

    @HandlePost("incidents")
    IncidentId reportIncident(IncidentDetails details) {
        throw new IllegalCommandException("Not implemented yet");
    }

    @HandleGet("incidents")
    List<Incident> getIncidents() {
        return List.of();
    }

    @HandlePost("incidents/{incidentId}/offers")
    OfferId offerAssistance(@PathParam IncidentId incidentId, OfferDetails details) {
        throw new IllegalCommandException("Not implemented yet");
    }

    @HandlePost("incidents/{incidentId}/offers/{offerId}/accept")
    void acceptOffer(@PathParam IncidentId incidentId, @PathParam OfferId offerId) {
        throw new IllegalCommandException("Not implemented yet");
    }

    @HandlePost("incidents/{incidentId}/close")
    void closeIncident(@PathParam IncidentId incidentId) {
        throw new IllegalCommandException("Not implemented yet");
    }

    @Path("/api/*")
    @HandleOptions
    WebResponse corsPreflight() {
        return WebResponse.builder()
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, TRACE")
                .header("Access-Control-Max-Age", String.valueOf(Duration.ofDays(1).toSeconds()))
                .build();
    }

}
