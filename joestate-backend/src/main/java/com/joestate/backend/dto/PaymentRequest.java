package com.joestate.backend.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private String cardNumber;
    private String expiryDate;
    private String cvc;
}