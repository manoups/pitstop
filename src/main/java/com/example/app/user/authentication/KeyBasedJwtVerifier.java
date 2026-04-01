package com.example.app.user.authentication;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import io.fluxzero.common.MemoizingFunction;
import io.fluxzero.sdk.tracking.handling.authentication.UnauthenticatedException;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.security.interfaces.RSAPublicKey;
import java.util.Optional;

import static io.fluxzero.common.ObjectUtils.memoize;
import static io.fluxzero.sdk.configuration.ApplicationProperties.getProperty;

@Slf4j
public class KeyBasedJwtVerifier implements JWTVerifier {
    private final MemoizingFunction<String, JWTVerifier> delegates = memoize(this::createVerifier);

    @Override
    public DecodedJWT verify(String token) throws JWTVerificationException {
        if (token == null || token.isEmpty()) {
            throw new UnauthenticatedException("Authorization header missing");
        }
        return verify(JWT.decode(token));
    }

    @Override
    public DecodedJWT verify(DecodedJWT jwt) throws JWTVerificationException {
        return delegates.apply(Optional.ofNullable(jwt.getKeyId()).orElse("default")).verify(jwt);
    }

    @SneakyThrows
    private JWTVerifier createVerifier(String keyId) {
        var domain = getProperty("jwk.domain");
        if (domain == null) {
            return JWT.require(Algorithm.none()).build();
        }
        Algorithm algorithm;
        try {
            Jwk jwk = new UrlJwkProvider(new URI(getProperty("jwk.domain-keys")).toURL(), null, null).get(keyId);
            algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
        } catch (Exception e) {
            log.error("Failed to initialize JWT algorithm for key id {}", keyId, e);
            throw e;
        }
        return JWT.require(algorithm)
                .withIssuer(domain)
                .acceptLeeway(7 * 60).build();
    }
}
