package com.fracexec.api.admin.pool;

import com.fracexec.api.admin.dto.AdminExecutiveProfileResponse;
import com.fracexec.api.admin.dto.AdminPoolFilter;
import com.fracexec.api.admin.dto.ExecutivePoolItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminPoolService {
    Page<ExecutivePoolItemResponse> listPool(AdminPoolFilter filter, Pageable pageable);
    AdminExecutiveProfileResponse getPoolDetail(UUID profileId);
}
