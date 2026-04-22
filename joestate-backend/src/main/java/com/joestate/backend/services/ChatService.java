package com.joestate.backend.services;

import com.joestate.backend.dto.ChatThreadDTO;
import com.joestate.backend.dto.MessageDTO;
import com.joestate.backend.entities.ChatThread;
import com.joestate.backend.entities.Message;
import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.ChatThreadRepository;
import com.joestate.backend.repositories.MessageRepository;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    // 1. Get or Create a Thread (When a user clicks "Chat with Owner")
    @Transactional
    public Long startOrGetThread(Long propertyId, String inquirerEmail) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwner().getEmail().equals(inquirerEmail)) {
            throw new RuntimeException("You cannot message yourself!");
        }

        // 1. Find the person trying to send the message
        User inquirer = userRepository.findByEmail(inquirerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Check if the SENDER is muted from messaging
        if (inquirer.getBanStatus() == User.BanStatus.MUTE_MESSAGES ||
                inquirer.getBanStatus() == User.BanStatus.MUTE_BOTH ||
                inquirer.getBanStatus() == User.BanStatus.BANNED) {
            throw new RuntimeException("Your account has been restricted from messaging other users.");
        }

        // Return existing thread if it exists, otherwise create a new one!
        return threadRepository.findByProperty_PropertyIdAndInquirer_Email(propertyId, inquirerEmail)
                .map(ChatThread::getThreadId)
                .orElseGet(() -> {
                    ChatThread newThread = ChatThread.builder()
                            .property(property)
                            .inquirer(inquirer)
                            .build();
                    return threadRepository.save(newThread).getThreadId();
                });
    }

    // 2. Fetch the Inbox for the UI
    public List<ChatThreadDTO> getUserInbox(String email) {
        return threadRepository.findAllUserThreads(email).stream()
                .map(thread -> mapToThreadDTO(thread, email))
                .collect(Collectors.toList());
    }

    // 3. Fetch Chat History (and mark them as read!)
    @Transactional
    public List<MessageDTO> getChatHistory(Long threadId, String myEmail) {
        List<Message> messages = messageRepository.findByThread_ThreadIdOrderByTimestampAsc(threadId);

        // Mark messages sent by the OTHER person as read
        messages.stream()
                .filter(m -> !m.getSender().getEmail().equals(myEmail) && !m.isRead())
                .forEach(m -> m.setRead(true));

        messageRepository.saveAll(messages);

        return messages.stream().map(this::mapToMessageDTO).collect(Collectors.toList());
    }

    // 4. Save a Live Message to the Database
    @Transactional
    public MessageDTO saveMessage(Long threadId, String senderEmail, String content) {
        ChatThread thread = threadRepository.findById(threadId).orElseThrow();
        User sender = userRepository.findByEmail(senderEmail).orElseThrow();

        // Security check: Only the inquirer or the owner can send messages here!
        if (!thread.getInquirer().getEmail().equals(senderEmail) &&
                !thread.getProperty().getOwner().getEmail().equals(senderEmail)) {
            throw new RuntimeException("Unauthorized to send message in this thread");
        }

        Message message = Message.builder()
                .thread(thread)
                .sender(sender)
                .content(content)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update the thread so it jumps to the top of the inbox
        thread.setLastUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);

        return mapToMessageDTO(savedMessage);
    }

    // --- Private Helper Mappers ---
    private MessageDTO mapToMessageDTO(Message message) {
        return MessageDTO.builder()
                .messageId(message.getMessageId())
                .senderId(message.getSender().getUserId())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .build();
    }

    private ChatThreadDTO mapToThreadDTO(ChatThread thread, String myEmail) {
        boolean amITheInquirer = thread.getInquirer().getEmail().equals(myEmail);
        User otherUser = amITheInquirer ? thread.getProperty().getOwner() : thread.getInquirer();

        // Get the last message preview
        String lastMessageText = "No messages yet";
        if (thread.getMessages() != null && !thread.getMessages().isEmpty()) {
            lastMessageText = thread.getMessages().get(thread.getMessages().size() - 1).getContent();
        }

        long unreadCount = messageRepository.countByThread_ThreadIdAndSender_EmailNotAndIsReadFalse(thread.getThreadId(), myEmail);

        return ChatThreadDTO.builder()
                .threadId(thread.getThreadId())
                .propertyId(thread.getProperty().getPropertyId())
                .propertyTitle(thread.getProperty().getTitle())
                .propertyStatus(thread.getProperty().getStatus())
                .propertyPrice(thread.getProperty().getPrice())
                .propertyImageUrl(thread.getProperty().getImages().isEmpty() ? null : thread.getProperty().getImages().get(0).getImageUrl())
                .otherUserId(otherUser.getUserId())
                .otherUserEmail(otherUser.getEmail())
                .otherUserName(otherUser.getFirstName() + " " + otherUser.getLastName())
                .otherUserAvatarUrl(otherUser.getProfilePictureUrl())
                .lastMessage(lastMessageText)
                .lastUpdatedAt(thread.getLastUpdatedAt())
                .unreadCount(unreadCount)
                .build();
    }
}