package com.fracexec.api.admin.pool;

import com.fracexec.api.admin.dto.AdminExecutiveProfileResponse;
import com.fracexec.api.admin.dto.AdminPoolFilter;
import com.fracexec.api.admin.dto.ExecutivePoolItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/pool")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPoolController {

    private final AdminPoolService poolService;

    public AdminPoolController(AdminPoolService poolService) {
        this.poolService = poolService;
    }

    @GetMapping
    public ResponseEntity<Page<ExecutivePoolItemResponse>> listPool(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) Integer minAvailability,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String profileStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        AdminPoolFilter filter = new AdminPoolFilter(specialty, minAvailability, sector, profileStatus);
        return ResponseEntity.ok(poolService.listPool(filter, PageRequest.of(page, size)));
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<AdminExecutiveProfileResponse> getDetail(@PathVariable UUID profileId) {
        return ResponseEntity.ok(poolService.getPoolDetail(profileId));
    }
}
