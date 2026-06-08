package com.fracexec.api.admin.service;

import com.fracexec.api.admin.dto.AdminApplicationDetailResponse;
import com.fracexec.api.admin.dto.DocumentUrlResponse;
import com.fracexec.api.executive.dto.ApplicationDetailResponse;
import com.fracexec.api.executive.dto.ApplicationSummaryResponse;
import com.fracexec.api.executive.dto.RejectRequest;
import com.fracexec.api.executive.dto.UpdateNotesRequest;
import com.fracexec.api.executive.dto.UpdateStatusRequest;
import com.fracexec.api.executive.model.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

public interface AdminApplicationService {
    Page<ApplicationSummaryResponse> listApplications(
        ApplicationStatus status, String name, Instant dateFrom, Instant dateTo, Pageable pageable);

    ApplicationDetailResponse getApplication(UUID id);

    AdminApplicationDetailResponse getApplicationAdmin(UUID id);

    ApplicationSummaryResponse updateStatus(UUID id, UpdateStatusRequest request);

    // P3: void — front-end descarta a resposta; evita S3 presign desnecessário
    void updateNotes(UUID id, UpdateNotesRequest request);

    DocumentUrlResponse uploadDocument(UUID id, MultipartFile file);

    DocumentUrlResponse getDocumentUrl(UUID id);

    ApplicationSummaryResponse approve(UUID id);

    ApplicationSummaryResponse reject(UUID id, RejectRequest request);
}
