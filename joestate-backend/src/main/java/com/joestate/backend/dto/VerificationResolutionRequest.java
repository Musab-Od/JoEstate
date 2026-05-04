package com.joestate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor // THIS IS WHAT FIXES THE 400 ERROR!
@AllArgsConstructor
public class VerificationResolutionRequest {
    private String action;
    private String adminReply;
}