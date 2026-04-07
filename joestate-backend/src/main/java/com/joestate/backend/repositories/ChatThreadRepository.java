package com.joestate.backend.repositories;

import com.joestate.backend.entities.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {

    // 1. Inbox View: Find all chats for a specific user (whether they are the buyer or the seller)
    @Query("SELECT c FROM ChatThread c WHERE c.inquirer.email = :email OR c.property.owner.email = :email ORDER BY c.lastUpdatedAt DESC")
    List<ChatThread> findAllUserThreads(@Param("email") String email);

    // 2. Prevent Duplicates: Check if a user already started a chat about this specific property
    Optional<ChatThread> findByProperty_PropertyIdAndInquirer_Email(Long propertyId, String email);
}