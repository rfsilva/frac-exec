package com.fracexec.api.notification.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final String TEMPLATE_DIR = "templates/email/";
    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("America/Sao_Paulo"));

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendApplicationReceived(String toEmail, String applicantName) {
        String body = loadTemplate("application-received.html")
            .replace("{{applicantName}}", applicantName);
        sendHtml(toEmail, "Candidatura recebida — FracExec", body);
    }

    @Override
    public void sendApplicationApproved(String toEmail, String applicantName, String profileLink) {
        String body = loadTemplate("application-approved.html")
            .replace("{{applicantName}}", applicantName)
            .replace("{{profileLink}}", profileLink);
        sendHtml(toEmail, "Candidatura aprovada — FracExec", body);
    }

    @Override
    public void sendApplicationRejected(String toEmail, String applicantName, Instant reapplyAfter) {
        String reapplyMessage = reapplyAfter != null
            ? "Você poderá submeter uma nova candidatura a partir de <strong>" + DATE_FMT.format(reapplyAfter) + "</strong>."
            : "";
        String body = loadTemplate("application-rejected.html")
            .replace("{{applicantName}}", applicantName)
            .replace("{{reapplyMessage}}", reapplyMessage);
        sendHtml(toEmail, "Resultado da sua candidatura — FracExec", body);
    }

    @Override
    public void sendNeedReceived(String toEmail, String companyName) {
        String body = loadTemplate("need-received.html")
            .replace("{{companyName}}", companyName);
        sendHtml(toEmail, "Necessidade recebida — FracExec", body);
    }

    @Override
    public void sendContractReady(String toEmail, String name, String downloadUrl) {
        String body = loadTemplate("contract-ready.html")
            .replace("{{name}}", name)
            .replace("{{downloadUrl}}", downloadUrl);
        sendHtml(toEmail, "Contrato disponível para assinatura — FracExec", body);
    }

    @Override
    public void sendPaymentProcessed(String toEmail, java.math.BigDecimal grossAmount,
                                     java.math.BigDecimal feeAmount, java.math.BigDecimal netAmount,
                                     java.time.Instant transferDate) {
        String body = "<p>Seu repasse foi processado:</p>"
            + "<p>Valor bruto: <strong>R$ " + grossAmount + "</strong></p>"
            + "<p>Taxa FracExec (18%): R$ " + feeAmount + "</p>"
            + "<p>Valor líquido: <strong>R$ " + netAmount + "</strong></p>"
            + "<p>Data de crédito: " + transferDate + "</p>";
        sendHtml(toEmail, "Repasse processado — FracExec", body);
    }

    @Override
    public void sendPaymentReceipt(String toEmail, java.math.BigDecimal grossAmount,
                                   java.time.Instant paidDate) {
        String body = "<p>Comprovante de pagamento:</p>"
            + "<p>Valor pago: <strong>R$ " + grossAmount + "</strong></p>"
            + "<p>Data: " + paidDate + "</p>";
        sendHtml(toEmail, "Comprovante de pagamento — FracExec", body);
    }

    @Override
    public void sendDeletionRequestConfirmation(String toEmail) {
        String body = "<p>Sua solicitação de exclusão de dados foi recebida.</p>"
            + "<p>Seus dados pessoais serão anonimizados em até <strong>30 dias</strong>.</p>"
            + "<p>Contratos e histórico financeiro são preservados por obrigação legal.</p>"
            + "<p>Equipe FracExec</p>";
        sendHtml(toEmail, "Solicitação de exclusão recebida — FracExec", body);
    }

    @Override
    public void sendBothDeclined(String adminEmail, String needId) {
        String body = "<p>Ambos os executivos declinaram a necessidade <strong>" + needId
            + "</strong>. A necessidade voltou para UNDER_ANALYSIS e requer um novo ciclo de shortlist.</p>";
        sendHtml(adminEmail, "Atenção: Ambos os executivos declinaram — FracExec", body);
    }

    @Override
    public void sendNewMediationMessage(String toEmail, String senderLabel, String contentPreview) {
        String body = "<p>Nova mensagem de <strong>" + senderLabel + "</strong> na plataforma FracExec:</p>"
            + "<blockquote>" + contentPreview + "</blockquote>"
            + "<p>Acesse o portal para ver a mensagem completa.</p>";
        sendHtml(toEmail, "Nova mensagem no FracExec", body);
    }

    @Override
    public void sendOpportunityAvailable(String toEmail, String cLevelType, String sector,
                                         String employeeRange, String scopeDays, String challengeSummary) {
        String body = loadTemplate("opportunity-available.html")
            .replace("{{cLevelType}}", cLevelType)
            .replace("{{sector}}", sector)
            .replace("{{employeeRange}}", employeeRange)
            .replace("{{scopeDays}}", scopeDays)
            .replace("{{challengeSummary}}", challengeSummary);
        sendHtml(toEmail, "Nova oportunidade disponível — FracExec", body);
    }

    @Override
    public void sendShortlistSent(String toEmail, String companyName) {
        String body = loadTemplate("shortlist-sent.html")
            .replace("{{companyName}}", companyName);
        sendHtml(toEmail, "Shortlist disponível para revisão — FracExec", body);
    }

    @Override
    public void sendCompanyActivated(String toEmail, String companyName, String firstAccessLink) {
        String body = loadTemplate("company-activated.html")
            .replace("{{companyName}}", companyName)
            .replace("{{firstAccessLink}}", firstAccessLink);
        sendHtml(toEmail, "Acesso ativado — FracExec", body);
    }

    private String loadTemplate(String templateName) {
        try {
            ClassPathResource resource = new ClassPathResource(TEMPLATE_DIR + templateName);
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Template de e-mail não encontrado '{}': {}", templateName, e.getClass().getSimpleName());
            return "<p>Notificação FracExec</p>";
        }
    }

    private void sendHtml(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("E-mail enviado: {}", subject);
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail '{}': {}", subject, e.getClass().getSimpleName());
        }
    }
}
