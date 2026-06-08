package com.fracexec.api.admin;

import com.fracexec.api.admin.dto.AdminApplicationDetailResponse;
import com.fracexec.api.admin.dto.DocumentUrlResponse;
import com.fracexec.api.admin.service.AdminApplicationService;
import com.fracexec.api.executive.dto.ApplicationSummaryResponse;
import com.fracexec.api.executive.dto.RejectRequest;
import com.fracexec.api.executive.dto.UpdateNotesRequest;
import com.fracexec.api.executive.dto.UpdateStatusRequest;
import com.fracexec.api.executive.model.ApplicationStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApplicationController {

    private final AdminApplicationService service;

    public AdminApplicationController(AdminApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ApplicationSummaryResponse>> list(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(service.listApplications(status, name, dateFrom, dateTo, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminApplicationDetailResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getApplicationAdmin(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationSummaryResponse> updateStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(service.updateStatus(id, request));
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<Void> updateNotes(
            @PathVariable UUID id, @RequestBody UpdateNotesRequest request) {
        service.updateNotes(id, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUrlResponse> uploadDocument(
            @PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.uploadDocument(id, file));
    }

    @GetMapping("/{id}/documents/url")
    public ResponseEntity<DocumentUrlResponse> getDocumentUrl(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getDocumentUrl(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApplicationSummaryResponse> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApplicationSummaryResponse> reject(
            @PathVariable UUID id, @Valid @RequestBody RejectRequest request) {
        return ResponseEntity.ok(service.reject(id, request));
    }
}
