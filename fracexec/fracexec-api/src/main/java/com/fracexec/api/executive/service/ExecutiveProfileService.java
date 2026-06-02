package com.fracexec.api.executive.service;

import com.fracexec.api.executive.dto.AvailabilityUpdateRequest;
import com.fracexec.api.executive.dto.AvailabilityUpdateResponse;
import com.fracexec.api.executive.dto.ExecutiveProfileResponse;
import com.fracexec.api.executive.dto.ProfileCompleteResponse;
import com.fracexec.api.executive.dto.SaveProfileRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ExecutiveProfileService {
    ExecutiveProfileResponse getProfile(UUID userId);
    ExecutiveProfileResponse saveProfile(UUID userId, SaveProfileRequest request);
    String uploadPhoto(UUID userId, MultipartFile file);
    ProfileCompleteResponse isComplete(UUID userId);
    AvailabilityUpdateResponse updateAvailability(UUID userId, AvailabilityUpdateRequest request);
}
