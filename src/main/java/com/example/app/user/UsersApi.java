package com.example.app.user;

import com.example.app.user.api.UserDetails;
import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import com.example.app.user.api.command.CreateUser;
import com.example.app.user.api.query.GetUserProfile;
import com.example.app.user.api.query.GetUsers;
import com.example.app.user.authentication.Role;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.web.HandleGet;
import io.fluxzero.sdk.web.HandlePost;
import io.fluxzero.sdk.web.Path;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Path("/api")
public class UsersApi {
    @HandleGet("/user")
    UserProfile getUser() {
        return Fluxzero.queryAndWait(new GetUserProfile());
    }

    @HandlePost("/users")
    UserId createUser(UserDetails details) {
        var userId = new UserId(Fluxzero.generateId());
        Fluxzero.sendCommandAndWait(new CreateUser(userId, details, Role.user));
        return userId;
    }

    @HandleGet("/users")
    List<UserProfile> getUsers() {
        return Fluxzero.queryAndWait(new GetUsers());
    }

}
