package com.fracexec.api.admin.pool;

import com.fracexec.api.admin.dto.AdminExecutiveProfileResponse;
import com.fracexec.api.admin.dto.AdminPoolFilter;
import com.fracexec.api.admin.dto.ExecutivePoolItemResponse;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ExecutiveSector;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.model.SpecialtyType;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.storage.MinioStorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AdminPoolServiceImpl implements AdminPoolService {

    private final ExecutiveProfileRepository profileRepository;
    private final MinioStorageService minioStorageService;

    public AdminPoolServiceImpl(ExecutiveProfileRepository profileRepository,
                                MinioStorageService minioStorageService) {
        this.profileRepository = profileRepository;
        this.minioStorageService = minioStorageService;
    }

    @Override
    public Page<ExecutivePoolItemResponse> listPool(AdminPoolFilter filter, Pageable pageable) {
        SpecialtyType specialtyEnum = null;
        if (filter.specialty() != null && !filter.specialty().isBlank()) {
            try { specialtyEnum = SpecialtyType.valueOf(filter.specialty().toUpperCase()); }
            catch (IllegalArgumentException ignored) { /* unknown specialty — no results */ }
        }
        return profileRepository.findCompleteProfilesWithFilters(
                specialtyEnum,
                filter.minAvailability(),
                filter.sector(),
                filter.profileStatus(),
                pageable)
            .map(this::toPoolItem);
    }

    @Override
    public AdminExecutiveProfileResponse getPoolDetail(UUID profileId) {
        ExecutiveProfile profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Executivo não encontrado."));

        String photoUrl = null;
        if (profile.getPhotoKey() != null) {
            photoUrl = minioStorageService.generatePresignedDownloadUrl(
                minioStorageService.getProfilesBucket(),
                profile.getPhotoKey(), Duration.ofHours(1));
        }

        List<String> specialties = profile.getSpecialties().stream()
            .map(s -> s.getSpecialty().name()).toList();
        List<String> sectors = profile.getSectors().stream()
            .map(ExecutiveSector::getSectorName).toList();

        return new AdminExecutiveProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getUser().getEmail(),
            profile.getUser().getEmail(),  // fullName not on User — using email as display name
            profile.getBio(),
            profile.getExperienceSummary(),
            photoUrl, specialties, sectors,
            profile.getAvailabilityDaysPerMonth(),
            profile.getProfileStatus().name(),
            profile.getCompanyVisibility()
        );
    }

    private ExecutivePoolItemResponse toPoolItem(ExecutiveProfile p) {
        // Use email local-part as display name (User entity has no fullName field)
        String email    = p.getUser() != null ? p.getUser().getEmail() : "";
        String fullName = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String initials = fullName.length() >= 2
            ? fullName.substring(0, 2).toUpperCase()
            : fullName.toUpperCase();

        List<String> specialties = p.getSpecialties().stream()
            .map(s -> s.getSpecialty().name()).toList();
        List<String> sectors = p.getSectors().stream()
            .map(ExecutiveSector::getSectorName).toList();

        boolean isAvailable = p.getProfileStatus() == ProfileStatus.ACTIVE
            && p.getAvailabilityDaysPerMonth() > 0;

        return new ExecutivePoolItemResponse(
            p.getId(),
            p.getUser() != null ? p.getUser().getId() : null,
            email,
            fullName,
            initials,
            specialties, sectors,
            p.getAvailabilityDaysPerMonth(),
            p.getProfileStatu