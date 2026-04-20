package com.joestate.backend.repositories;

import com.joestate.backend.entities.VerificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    // The Admin will need this to fetch the queue of pending requests!
    List<VerificationRequest> findByStatus(VerificationRequest.RequestStatus status);

    // Used for the Admin Dashboard KPIs
    long countByStatus(VerificationRequest.RequestStatus status);
}