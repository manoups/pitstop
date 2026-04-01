package com.example.app.web;

import com.example.app.pitstop.api.Incident;
import com.example.app.refdata.api.Operator;
import com.example.app.user.api.UserId;
import com.example.app.user.api.UserProfile;
import com.example.app.user.authentication.Sender;
import com.example.app.web.api.UiUpdate;
import com.fasterxml.jackson.databind.JsonNode;
import com.flipkart.zjsonpatch.JsonDiff;
import io.fluxzero.common.serialization.JsonUtils;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.common.Message;
import io.fluxzero.sdk.common.serialization.Serializer;
import io.fluxzero.sdk.modeling.Entity;
import io.fluxzero.sdk.tracking.handling.HandleNotification;
import io.fluxzero.sdk.tracking.handling.authentication.RequiresUser;
import io.fluxzero.sdk.web.HandleSocketClose;
import io.fluxzero.sdk.web.HandleSocketOpen;
import io.fluxzero.sdk.web.SocketSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class UiUpdater {
    final Map<UserId, List<SocketSession>> openSessions = new ConcurrentHashMap<>();

    @HandleNotification
    void handleUserUpdate(Entity<UserProfile> entity) {
        handleAnyUpdate(entity);
    }

    @HandleNotification
    void handleIncidentUpdate(Entity<Incident> entity) {
        handleAnyUpdate(entity);
    }

    @HandleNotification
    void handleOperatorUpdate(Entity<Operator> entity) {
        handleAnyUpdate(entity);
    }

    @HandleSocketOpen("/api/updates")
    @RequiresUser
    void startListening(Sender user, SocketSession session) {
        openSessions.computeIfAbsent(user.getUserId(), u -> new CopyOnWriteArrayList<>())
                .add(session);
    }

    @HandleSocketClose("/api/updates")
    void stopListening(SocketSession session) {
        openSessions.forEach((key, value) -> {
            if (value.removeIf(s -> s.sessionId().equals(session.sessionId())) && value.isEmpty()) {
                openSessions.remove(key);
            }
        });
    }

    <T> void handleAnyUpdate(Entity<T> entity) {
        handleAnyUpdate(entity.id().toString(), entity.previous().get(), entity.get(), entity.lastEventIndex(),
                        UiUpdate.Type.valueOf(entity.type().getSimpleName()));
    }

    <T> void handleAnyUpdate(String entityId, T before, T after, Long index, UiUpdate.Type type) {
        Serializer serializer = Fluxzero.get().serializer();
        openSessions.forEach((userId, sessions) -> {
            try {
                var sender = Sender.createSender(userId);
                if (sender == null) {
                    log.info("User {} not found. Closing socket sessions.", userId);
                    sessions.forEach(SocketSession::close);
                    return;
                }
                var b = serializer.filterContent(before, sender);
                var a = serializer.filterContent(after, sender);
                if (a != null || b != null) {
                    sessions.forEach(session -> {
                        try {
                            JsonNode source = JsonUtils.convertValue(b, JsonNode.class);
                            JsonNode target = JsonUtils.convertValue(a, JsonNode.class);
                            JsonNode patch = JsonDiff.asJson(source, target);
                            if (!patch.isEmpty()) {
                                UiUpdate update = new UiUpdate(type, index, entityId, patch);
                                session.sendMessage(Message.asMessage(update)
                                                            .addMetadata("subscriber", userId.getFunctionalId()));
                            }
                        } catch (Throwable e) {
                            log.warn("Failed to send update to user {} (session: {})", userId, session.sessionId(), e);
                        }
                    });
                }
            } catch (Throwable e) {
                log.error("Failed to send update to ui (userId: {})", userId, e);
            }
        });
    }

}
