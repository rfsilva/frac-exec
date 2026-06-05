package com.fracexec.api.notification.service;

import java.time.Instant;

public interface EmailService {
    void sendApplicationReceived(String toEmail, String applicantName);
    void sendApplicationApproved(String toEmail, String applicantName, String profileLink);
    void sendApplicationRejected(String toEmail, String applicantName, Instant reapplyAfter);
    void sendNeedReceived(String toEmail, String companyName);
    void sendCompanyActivated(String toEmail, String companyName, String firstAccessLink);
    void sendShortlistSent(String toEmail, String companyName);
    void sendOpportunityAvailable(String toEmail, String cLevelType, String sector,
                                  String employeeRange, String scopeDays, String challengeSummary);
    void sendBothDeclined(String adminEmail, String needId);
    void sendNewMediationMessage(String toEmail, String senderLabel, String contentPreview);
}
