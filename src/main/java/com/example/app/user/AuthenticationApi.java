package com.example.app.user;

import com.example.app.user.authentication.GetRoles;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.web.HandleGet;
import io.fluxzero.sdk.web.Path;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Path("/api")
public class AuthenticationApi {
    @HandleGet("/roles")
    Map<String, String> authenticate() {
        return Fluxzero.queryAndWait(new GetRoles());
    }
}
