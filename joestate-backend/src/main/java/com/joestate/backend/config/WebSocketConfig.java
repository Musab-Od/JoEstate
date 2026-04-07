package com.joestate.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // "/topic" is the prefix for broadcasting messages back to React
        config.enableSimpleBroker("/topic");
        // "/app" is the prefix React will use to send messages TO Spring Boot
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the URL React will connect to (http://localhost:8080/ws)
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173") // Allow React to connect
                .withSockJS(); // Fallback for older browsers
    }
}