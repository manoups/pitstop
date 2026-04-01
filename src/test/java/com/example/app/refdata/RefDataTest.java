package com.example.app.refdata;

import com.example.app.refdata.api.OperatorId;
import com.example.app.user.api.UserId;
import com.example.app.user.api.command.AuthorizeForOperator;
import com.example.app.user.authentication.AuthenticationUtils;
import io.fluxzero.sdk.test.TestFixture;
import io.fluxzero.sdk.tracking.handling.IllegalCommandException;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

public class RefDataTest {

    final TestFixture testFixture = TestFixture.create(RefDataApi.class);

    @Test
    void registerOperators() {
        testFixture.whenCommand("/refdata/register-operators.json")
                .expectEvents("/refdata/register-operator-allstate.json");
    }

    @Test
    void registerOperatorWithOwner() {
        testFixture.givenCommands("/user/create-user.json")
                .whenCommand("/refdata/register-operator-with-owner.json")
                .expectEvents("/refdata/register-operator-with-owner.json", AuthorizeForOperator.class);
    }

    @Test
    void registerOperatorWithOwner_nonExistentOwner() {
        testFixture
                .whenCommand("/refdata/register-operator-with-owner.json")
                .expectNoEvents().expectExceptionalResult(IllegalCommandException.class);
    }

    @Nested
    class ApiTests {
        @Test
        void registerOperator() {
            testFixture.givenCommands("/user/create-user.json")
                    .withHeader("Authorization", createAuthorizationHeader("user"))
                    .whenPost("/api/operator", "/refdata/operator-details.json")
                    .expectResult(OperatorId.class);
        }
    }

    String createAuthorizationHeader(String user) {
        return testFixture.getFluxzero().apply(
                fc -> AuthenticationUtils.createAuthorizationHeader(new UserId(user)));
    }
}
