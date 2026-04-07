package com.joestate.backend.controllers;

import com.joestate.backend.dto.ChatThreadDTO;
import com.joestate.backend.dto.MessageDTO;
import com.joestate.backend.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate; // The tool to broadcast live messages!

    // 1. Start a new chat from the Property Details Page
    @PostMapping("/start/{propertyId}")
    public ResponseEntity<Long> startThread(@PathVariable Long propertyId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long threadId = chatService.startOrGetThread(propertyId, email);
        return ResponseEntity.ok(threadId);
    }

    // 2. Fetch Inbox
    @GetMapping("/inbox")
    public ResponseEntity<List<ChatThreadDTO>> getInbox() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(chatService.getUserInbox(email));
    }

    // 3. Fetch History of a specific chat
    @GetMapping("/{threadId}/history")
    public ResponseEntity<List<MessageDTO>> getChatHistory(@PathVariable Long threadId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(chatService.getChatHistory(threadId, email));
    }

    // 4. THE LIVE WEBSOCKET ENDPOINT (Receives message, saves to DB, broadcasts to receiver)
    @MessageMapping("/chat/{threadId}/send")
    public void sendLiveMessage(@DestinationVariable Long threadId, @Payload Map<String, String> payload) {
        String senderEmail = payload.get("senderEmail");
        String content = payload.get("content");

        // Save to Database
        MessageDTO savedMessage = chatService.saveMessage(threadId, senderEmail, content);

        // Broadcast to anyone listening to this specific thread room!
        messagingTemplate.convertAndSend("/topic/thread/" + threadId, savedMessage);
    }
}