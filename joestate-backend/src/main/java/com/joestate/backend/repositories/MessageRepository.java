package com.joestate.backend.repositories;

import com.joestate.backend.entities.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // 1. Chat Window: Get all messages in a specific thread, oldest to newest.
    List<Message> findByThread_ThreadIdOrderByTimestampAsc(Long threadId);

    // 2. Notifications: Count how many unread messages are in this thread that were NOT sent by me
    long countByThread_ThreadIdAndSender_EmailNotAndIsReadFalse(Long threadId, String myEmail);
}