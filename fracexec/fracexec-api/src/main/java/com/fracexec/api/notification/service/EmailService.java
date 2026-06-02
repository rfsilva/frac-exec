package com.fracexec.api.notification.service;

import java.time.Instant;

public interface EmailService {
    void sendApplicationReceived(String toEmail, String applicantName);
    void sendApplicationApproved(String toEmail, String applicantName, String profileLink);
    void sendApplicationRejected(String toEmail, String applicantName, Instant reapplyAfter);
}
