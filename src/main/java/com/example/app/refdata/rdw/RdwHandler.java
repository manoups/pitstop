package com.example.app.refdata.rdw;

import com.example.app.pitstop.api.Vehicle;
import com.example.app.refdata.api.query.FindVehicles;
import io.fluxzero.common.serialization.JsonUtils;
import io.fluxzero.sdk.tracking.handling.HandleQuery;
import io.fluxzero.sdk.tracking.handling.LocalHandler;
import org.springframework.stereotype.Component;

import java.util.List;

import static io.fluxzero.sdk.Fluxzero.queryAndWait;
import static io.micrometer.common.util.StringUtils.isBlank;

@Component
@LocalHandler
public class RdwHandler {

    @HandleQuery
    List<Vehicle> handle(FindVehicles query) {
        String licensePlateQuery = isBlank(query.getTerm()) ? query.getTerm()
                : query.getTerm().toUpperCase().replaceAll("[^A-Z0-9]", "");
        String response = queryAndWait(new GetRdwData(
                "/resource/m9d7-ebf2.json?$where=starts_with(kenteken,'%s')&$limit=10"
                        .formatted(licensePlateQuery)));
        List<RdwVehicle> vehicles
                = JsonUtils.fromJson(response, tf -> tf.constructCollectionType(List.class, RdwVehicle.class));
        return vehicles.stream().map(RdwVehicle::toVehicle).toList();
    }

}
