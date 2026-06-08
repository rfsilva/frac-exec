package com.fracexec.api.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.contract.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final PaymentService paymentService;
    private final ObjectMapper   objectMapper;

    public StripeWebhookController(PaymentService paymentService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.objectMapper   = objectMapper;
    }

    @PostMapping
    public ResponseEntity<String> handle(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {

        try {
            JsonNode root       = objectMapper.readTree(payload);
            String   eventType  = root.path("type").asText("");
            String   intentId   = root.path("data").path("object").path("id").asText(null);

            if (intentId == null || intentId.isBlank()) {
                return ResponseEntity.ok("no-op");
            }

            switch (eventType) {
                case "payment_intent.succeeded"      -> paymentService.processWebhookSucceeded(intentId);
                case "payment_intent.payment_failed",
                     "payment_intent.canceled"       -> paymentService.processWebhookExpired(intentId);
                default                              -> log.debug("Evento Stripe ignorado: {}", eventType);
            }
        } catch (Exception e) {
            log.warn("Erro ao processar webhook Stripe: {}", e.getMessage());
        }

        return ResponseEntity.ok("received");
    }
}
