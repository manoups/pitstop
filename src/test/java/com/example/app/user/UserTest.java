package com.example.app.user;

import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import com.example.app.user.api.command.CreateUser;
import com.example.app.user.api.query.GetUsers;
import io.fluxzero.sdk.test.TestFixture;
import io.fluxzero.sdk.tracking.handling.authentication.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

class UserTest {

    final TestFixture testFixture = TestFixture.create();

    @Test
    void createUser() {
        testFixture.whenCommand("/user/create-user.json")
                .expectEvents("/user/create-user.json");
    }


    @Test
    void createUserAllowedAsAdmin() {
        testFixture
                .givenCommands("/user/create-admin.json")
                .whenCommandByUser("admin", "/user/create-user.json")
                .expectEvents("/user/create-user.json");
    }

    @Test
    void createUserNotAllowedAsUser() {
        testFixture.whenCommandByUser("user", "/user/create-admin.json")
                .expectExceptionalResult(UnauthorizedException.class);
    }

    @Test
    void getUsers() {
        testFixture.givenCommands("/user/create-user.json")
                .whenQuery(new GetUsers())
                .expectResult(r -> r.size() == 1);
    }

    @Nested
    class UsersApiTests {

        @BeforeEach
        void setUp() {
            testFixture.registerHandlers(new UsersApi());
        }

        @Test
        void createUser() {
            testFixture
                    .whenPost("/api/users","/user/user-details.json")
                    .expectResult(UserId.class)
                    .expectEvents(CreateUser.class);
        }

        @Test
        void getUsers() {
            testFixture.givenPost("/api/users", "/user/user-details.json")
                    .whenGet("/api/users")
                    .<List<UserProfile>>expectResult(r -> !r.isEmpty());
        }
    }
}