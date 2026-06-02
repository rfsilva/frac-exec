package com.fracexec.api.executive;

import com.fracexec.api.executive.dto.AvailabilityUpdateRequest;
import com.fracexec.api.executive.dto.AvailabilityUpdateResponse;
import com.fracexec.api.executive.dto.ExecutiveProfileResponse;
import com.fracexec.api.executive.dto.ProfileCompleteResponse;
import com.fracexec.api.executive.dto.SaveProfileRequest;
import com.fracexec.api.executive.service.ExecutiveProfileService;
import com.fracexec.api.shared.auth.model.User;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executive/profile")
@PreAuthorize("hasRole('EXECUTIVE')")
public class ExecutiveProfileController {

    private final ExecutiveProfileService profileService;

    public ExecutiveProfileController(ExecutiveProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ExecutiveProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.getProfile(userId(userDetails)));
    }

    @PutMapping
    public ResponseEntity<ExecutiveProfileResponse> saveProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SaveProfileRequest request) {
        return ResponseEntity.ok(profileService.saveProfile(userId(userDetails), request));
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String url = profileService.uploadPhoto(userId(userDetails), file);
        return ResponseEntity.ok(Map.of("photoUrl", url));
    }

    @GetMapping("/complete")
    public ResponseEntity<ProfileCompleteResponse> isComplete(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.isComplete(userId(userDetails)));
    }

    @PatchMapping("/availability")
    public ResponseEntity<AvailabilityUpdateResponse> updateAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AvailabilityUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateAvailability(userId(userDetails), request));
    }

    private UUID userId(UserDetails userDetails) {
        return ((User) userDetails).getId();
    }
}
