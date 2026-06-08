package com.fracexec.api.executive.service;

import com.fracexec.api.executive.dto.AvailabilityUpdateRequest;
import com.fracexec.api.executive.dto.AvailabilityUpdateResponse;
import com.fracexec.api.executive.dto.ExecutiveProfileResponse;
import com.fracexec.api.executive.dto.ProfileCompleteResponse;
import com.fracexec.api.executive.dto.SaveProfileRequest;
import com.fracexec.api.executive.model.*;
import com.fracexec.api.executive.repository.ExecutiveApplicationRepository;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.storage.MinioStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ExecutiveProfileServiceImpl implements ExecutiveProfileService {

    private static final Logger log = LoggerFactory.getLogger(ExecutiveProfileServiceImpl.class);

    private final ExecutiveProfileRepository profileRepository;
    private final ExecutiveApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final MinioStorageService minioStorageService;
    private final S3Client s3Client;

    public ExecutiveProfileServiceImpl(
            ExecutiveProfileRepository profileRepository,
            ExecutiveApplicationRepository applicationRepository,
            UserRepository userRepository,
            MinioStorageService minioStorageService,
            S3Client s3Client) {
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.minioStorageService = minioStorageService;
        this.s3Client = s3Client;
    }

    @Override
    public ExecutiveProfileResponse getProfile(UUID userId) {
        ExecutiveProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> createEmptyProfile(userId));
        return toResponse(profile);
    }

    @Override
    @Transactional
    public ExecutiveProfileResponse saveProfile(UUID userId, SaveProfileRequest request) {
        ExecutiveProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> profileRepository.save(createEmptyProfile(userId)));

        if (request.bio() != null) profile.setBio(request.bio());
        if (request.experienceSummary() != null) profile.setExperienceSummary(request.experienceSummary());
        if (request.companyVisibility() != null) profile.setCompanyVisibility(request.companyVisibility());

        // Especialidades: delete + insert; P4: retornar 400 para valores inválidos
        if (request.specialties() != null) {
            profile.getSpecialties().clear();
            for (String s : request.specialties()) {
                try {
                    profile.getSpecialties().add(
                        new ExecutiveSpecialty(profile, SpecialtyType.valueOf(s.toUpperCase())));
                } catch (IllegalArgumentException e) {
                    throw new BusinessRuleException("Especialidade inválida: " + s +
                        ". Valores aceitos: CFO, CTO, CMO, COO, OUTRO.");
                }
            }
        }

        if (request.sectors() != null) {
            profile.getSectors().clear();
            request.sectors().forEach(sec ->
                profile.getSectors().add(new ExecutiveSector(profile, sec)));
        }

        profileRepository.save(profile);
        log.info("Perfil atualizado para userId [{}]", userId);
        return toResponse(profile);
    }

    @Override
    @Transactional
    public String uploadPhoto(UUID userId, MultipartFile file) {
        ExecutiveProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> profileRepository.save(createEmptyProfile(userId)));

        String ext       = extractExtension(file.getOriginalFilename());
        String objectKey = "profiles/" + userId + "/" + UUID.randomUUID() + ext;

        try {
            PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(minioStorageService.getProfilesBucket())
                .key(objectKey)
                .contentType(file.getContentType())
                .build();
            s3Client.putObject(putReq, RequestBody.fromInputStream(
                file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            // P5: exceção de domínio mapeada pelo GlobalExceptionHandler → 422
            throw new BusinessRuleException("Falha ao fazer upload da foto. Tente novamente.");
        }

        profile.setPhotoKey(objectKey);
        profileRepository.save(profile);
        log.info("Foto atualizada para userId [{}]", userId);

        return minioStorageService.generatePresignedDownloadUrl(
            minioStorageService.getProfilesBucket(), objectKey, Duration.ofHours(1));
    }

    @Override
    public ProfileCompleteResponse isComplete(UUID userId) {
        return profileRepository.findByUserId(userId)
            .map(p -> new ProfileCompleteResponse(p.isComplete()))
            .orElse(new ProfileCompleteResponse(false));
    }

    @Override
    @Transactional
    public AvailabilityUpdateResponse updateAvailability(UUID userId, AvailabilityUpdateRequest request) {
        ExecutiveProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> profileRepository.save(createEmptyProfile(userId)));

        try {
            ProfileStatus status = ProfileStatus.valueOf(request.profileStatus().toUpperCase());
            profile.setProfileStatus(status);
        } catch (IllegalArgumentException e) {
            throw new com.fracexec.api.shared.exception.BusinessRuleException(
                "Status inválido: " + request.profileStatus() + ". Valores aceitos: ACTIVE, INACTIVE, SUSPENDED.");
        }
        profile.setAvailabilityDaysPerMonth(request.availabilityDaysPerMonth());
        profileRepository.save(profile);
        log.info("Disponibilidade atualizada para userId [{}]", userId);
        return new AvailabilityUpdateResponse(profile.getAvailabilityDaysPerMonth(), profile.getProfileStatus());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ExecutiveProfile createEmptyProfile(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return new ExecutiveProfile(user);
    }

    private ExecutiveProfileResponse toResponse(ExecutiveProfile profile) {
        String photoUrl = null;
        if (profile.getPhotoKey() != null) {
            photoUrl = minioStorageService.generatePresignedDownloadUrl(
                minioStorageService.getProfilesBucket(),
                profile.getPhotoKey(),
                Duration.ofHours(1));
        }

        List<String> specialties = profile.getSpecialties().stream()
            .map(s -> s.getSpecialty().name()).toList();

        List<String> sectors = profile.getSectors().stream()
            .map(ExecutiveSector::getSectorName).toList();

        // B1: buscar empresas da candidatura original para exibir toggles de visibilidade
        List<String> applicationCompanies = applicationRepository
            .findFirstByEmailAndStatusIn(
                profile.getUser() != null ? profile.getUser().getEmail() : "",
                List.of(ApplicationStatus.APPROVED))
            .map(app -> app.getPositions().stream()
                .map(p -> p.getCompanyName() != null ? p.getCompanyName() : "")
                .filter(n -> !n.isBlank())
                .distinct().toList())
            .orElse(List.of());

        return new ExecutiveProfileResponse(
            profile.getId(),
            profile.getBio(),
            profile.getExperienceSummary(),
            photoUrl,
            specialties,
            sectors,
            profile.getCompanyVisibility(),
            applicationCompanies,
            profile.getAvailabilityDaysPerMonth(),
            profile.getProfileStatus(),
            profile.isComplete(),
            profile.getCreatedAt());
    }

    private String extractExtension(String filename) {
        if (filename == null || filename.isBlank()) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        String ext = filename.substring(dot + 1).replaceAll("[^a-zA-Z0-9]", "");
        return ext.isBlank() ? "" : "." + ext;
    }
}
