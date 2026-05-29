package com.joestate.backend.services;

import com.joestate.backend.dto.MessageDTO;
import com.joestate.backend.entities.ChatThread;
import com.joestate.backend.entities.Message;
import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.ChatThreadRepository;
import com.joestate.backend.repositories.MessageRepository;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatThreadRepository threadRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatService chatService;

    private User owner;
    private User inquirer;
    private User hacker;
    private Property mockProperty;
    private ChatThread mockThread;

    @BeforeEach
    void setUp() {
        // 1. Setup Property Owner
        owner = new User();
        owner.setUserId(1L);
        owner.setEmail("owner@joestate.com");
        owner.setFirstName("Property");
        owner.setLastName("Owner");

        // 2. Setup Inquirer (Buyer/Renter)
        inquirer = new User();
        inquirer.setUserId(2L);
        inquirer.setEmail("buyer@test.com");
        inquirer.setBanStatus(User.BanStatus.NONE);
        inquirer.setFirstName("John");
        inquirer.setLastName("Doe");

        // 3. Setup a random unauthorized user
        hacker = new User();
        hacker.setUserId(3L);
        hacker.setEmail("hacker@test.com");

        // 4. Setup the Property
        mockProperty = new Property();
        mockProperty.setPropertyId(10L);
        mockProperty.setOwner(owner);

        // 5. Setup the Thread
        mockThread = new ChatThread();
        mockThread.setThreadId(100L);
        mockThread.setProperty(mockProperty);
        mockThread.setInquirer(inquirer);
    }

    // ==========================================
    // 1. START THREAD & BAN LOGIC TESTS
    // ==========================================

    @Test
    void startOrGetThread_Fails_WhenMessagingSelf() {
        // Arrange
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(mockProperty));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            chatService.startOrGetThread(10L, "owner@joestate.com");
        });

        assertEquals("You cannot message yourself!", exception.getMessage());
        verify(threadRepository, never()).save(any());
    }

    @Test
    void startOrGetThread_Fails_WhenUserIsMuted() {
        // Arrange
        inquirer.setBanStatus(User.BanStatus.MUTE_MESSAGES); // Restrict the user
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(mockProperty));
        when(userRepository.findByEmail("buyer@test.com")).thenReturn(Optional.of(inquirer));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            chatService.startOrGetThread(10L, "buyer@test.com");
        });

        assertEquals("Your account has been restricted from messaging other users.", exception.getMessage());
        verify(threadRepository, never()).save(any());
    }

    @Test
    void startOrGetThread_Success_CreatesNewThread() {
        // Arrange
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(mockProperty));
        when(userRepository.findByEmail("buyer@test.com")).thenReturn(Optional.of(inquirer));
        when(threadRepository.findByProperty_PropertyIdAndInquirer_Email(10L, "buyer@test.com")).thenReturn(Optional.empty());

        ChatThread savedThread = new ChatThread();
        savedThread.setThreadId(999L);
        when(threadRepository.save(any(ChatThread.class))).thenReturn(savedThread);

        // Act
        Long threadId = chatService.startOrGetThread(10L, "buyer@test.com");

        // Assert
        assertEquals(999L, threadId);
        verify(threadRepository, times(1)).save(any(ChatThread.class));
    }

    // ==========================================
    // 2. MESSAGE SECURITY TESTS
    // ==========================================

    @Test
    void saveMessage_Fails_WhenUnauthorizedUserTriesToMessage() {
        // Arrange
        when(threadRepository.findById(100L)).thenReturn(Optional.of(mockThread));
        when(userRepository.findByEmail("hacker@test.com")).thenReturn(Optional.of(hacker));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            chatService.saveMessage(100L, "hacker@test.com", "Injecting spam message!");
        });

        assertEquals("Unauthorized to send message in this thread", exception.getMessage());
        verify(messageRepository, never()).save(any());
    }

    // ==========================================
    // 3. READ RECEIPT LOGIC TESTS
    // ==========================================

    @Test
    void getChatHistory_MarksOnlyOtherUsersMessagesAsRead() {
        // Arrange
        Message messageFromOwner = new Message();
        messageFromOwner.setSender(owner);
        messageFromOwner.setRead(false);

        Message messageFromInquirer = new Message();
        messageFromInquirer.setSender(inquirer);
        messageFromInquirer.setRead(false);

        List<Message> mockMessages = new ArrayList<>();
        mockMessages.add(messageFromOwner);
        mockMessages.add(messageFromInquirer);

        when(messageRepository.findByThread_ThreadIdOrderByTimestampAsc(100L)).thenReturn(mockMessages);

        // Act
        // The inquirer opens the chat history
        List<MessageDTO> history = chatService.getChatHistory(100L, "buyer@test.com");

        // Assert
        assertEquals(2, history.size());
        assertTrue(messageFromOwner.isRead(), "The message from the owner should now be marked as read");
        assertFalse(messageFromInquirer.isRead(), "The inquirer's own message should remain unread to them (until the owner sees it)");

        verify(messageRepository, times(1)).saveAll(mockMessages);
    }
}