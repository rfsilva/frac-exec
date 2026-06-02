package com.fracexec.api.admin.pool;

import com.fracexec.api.admin.dto.AdminExecutiveProfileResponse;
import com.fracexec.api.admin.dto.AdminPoolFilter;
import com.fracexec.api.admin.dto.ExecutivePoolItemResponse;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ExecutiveSector;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.model.SpecialtyType;
import com.fracexec.api.executive.model.ApplicationStatus;
import com.fracexec.api.executive.repository.ExecutiveApplicationRepository;
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
    private final ExecutiveApplicationRepository applicationRepository;
    private final MinioStorageService minioStorageService;

    public AdminPoolServiceImpl(ExecutiveProfileRepository profileRepository,
                                ExecutiveApplicationRepository applicationRepository,
                                MinioStorageService minioStorageService) {
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
        this.minioStorageService = minioStorageService;
    }

    @Override
    public Page<ExecutivePoolItemResponse> listPool(AdminPoolFilter filter, Pageable pageable) {
        SpecialtyType specialtyEnum = null;
        if (filter.specialty() != null && !filter.specialty().isBlank()) {
            try { specialtyEnum = SpecialtyType.valueOf(filter.specialty().toUpperCase()); }
            catch (IllegalArgumentException ignored) { /* unknown specialty — no results */ }
        }
        // P5: convert String profileStatus to enum for type-safe query parameter
        ProfileStatus statusEnum = null;
        if (filter.profileStatus() != null && !filter.profileStatus().isBlank()) {
            try { statusEnum = ProfileStatus.valueOf(filter.profileStatus().toUpperCase()); }
            catch (IllegalArgumentException ignored) { /* unknown status — no results */ }
        }
        return profileRepository.findCompleteProfilesWithFilters(
                specialtyEnum,
                filter.minAvailability(),
                filter.sector(),
                statusEnum,
                pageable)
            .map(this::toPoolItem);
    }

    @Override
    public AdminExecutiveProfileResponse getPoolDetail(UUID profileId) {
        ExecutiveProfile profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Executivo não encontrado."));
        // P2: admin view also validates completeness for consistency with AC-2
        if (!profile.isComplete()) {
            throw new ResourceNotFoundException("Perfil de executivo não disponível na pool.");
        }

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

        // P4: build companyVisibilityRaw from real application_positions company names
        // Use what executive stored in companyVisibility as visibility flags,
        // but also include companies from the APPROVED application that may not be in the map
        java.util.Map<String, Boolean> rawVisibility = new java.util.LinkedHashMap<>(
            profile.getCompanyVisibility() != null ? profile.getCompanyVisibility() : java.util.Map.of());

        String email = profile.getUser() != null ? profile.getUser().getEmail() : "";
        applicationRepository
            .findFirstByEmailAndStatusIn(email, List.of(ApplicationStatus.APPROVED))
            .ifPresent(app -> app.getPositions().stream()
                .map(p -> p.getCompanyName())
                .filter(n -> n != null && !n.isBlank())
                .distinct()
                .forEach(company -> rawVisibility.putIfAbsent(company, true)));

        return new AdminExecutiveProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getUser().getEmail(),
            profile.getUser().getEmail(),
            profile.getBio(),
            profile.getExperienceSummary(),
            photoUrl, specialties, sectors,
            profile.getAvailabilityDaysPerMonth(),
            profile.getProfileStatus().name(),
            rawVisibility
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
            p.getProfileStatus().name(),
            isAvailable
        );
    }
}
