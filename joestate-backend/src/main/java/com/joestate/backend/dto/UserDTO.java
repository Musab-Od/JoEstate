package com.joestate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String bio;
    private String profilePictureUrl;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // Allows sending to server, but hides from response
    @Size(min = 6, message = "New password must be at least 6 characters")
    private String password;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String oldPassword;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String newPassword;
}