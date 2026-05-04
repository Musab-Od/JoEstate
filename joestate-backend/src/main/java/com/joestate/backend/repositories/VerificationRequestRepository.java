package com.joestate.backend.repositories;

import com.joestate.backend.entities.VerificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.joestate.backend.entities.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    // The Admin will need this to fetch the queue of pending requests!
    List<VerificationRequest> findByStatus(VerificationRequest.RequestStatus status);

    // Used for the Admin Dashboard KPIs
    long countByStatus(VerificationRequest.RequestStatus status);

    // Finds the user's most recent ticket
    Optional<VerificationRequest> findTopByUserOrderBySubmittedAtDesc(User user);

    List<VerificationRequest> findByStatusAndAssignedAdminIsNull(VerificationRequest.RequestStatus status);
    List<VerificationRequest> findByStatusAndAssignedAdmin_Email(VerificationRequest.RequestStatus status, String email);
}