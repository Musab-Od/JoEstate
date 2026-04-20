package com.joestate.backend.dto;

import com.joestate.backend.entities.VerificationRequest.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VerificationRequestDTO {
    private Long requestId;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String documentUrl;
    private RequestStatus status;
    private LocalDateTime submittedAt;
}