package com.fracexec.api.match.service;

import com.fracexec.api.company.Need;
import com.fracexec.api.company.NeedRepository;
import com.fracexec.api.company.NeedStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.*;
import com.fracexec.api.match.dto.AddExecutiveRequest;
import com.fracexec.api.match.dto.ShortlistExecutiveItem;
import com.fracexec.api.match.dto.ShortlistResponse;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.InvalidRequestException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ShortlistServiceImpl implements ShortlistService {

    private static final Logger log = LoggerFactory.getLogger(ShortlistServiceImpl.class);
    private static final int MAX_EXECUTIVES = 4;

    private final ShortlistRepository          shortlistRepository;
    private final ShortlistExecutiveRepository itemRepository;
    private final NeedRepository               needRepository;
    private final ExecutiveProfileRepository   profileRepository;
    private final ConflictDetectionService     conflictService;
    private final EmailService                 emailService;

    public ShortlistServiceImpl(ShortlistRepository shortlistRepository,
                                ShortlistExecutiveRepository itemRepository,
                                NeedRepository needRepository,
                                ExecutiveProfileRepository profileRepository,
                                ConflictDetectionService conflictService,
                                EmailService emailService) {
        this.shortlistRepository = shortlistRepository;
        this.itemRepository      = itemRepository;
        this.needRepository      = needRepository;
        this.profileRepository   = profileRepository;
        this.conflictService     = conflictService;
        this.emailService        = emailService;
    }

    @Override
    @Transactional(readOnly = true)
    public ShortlistResponse getOrCreate(UUID needId) {
        Need need = findNeed(needId);
        Shortlist shortlist = shortlistRepository.findByNeed(need)
            .orElseGet(() -> shortlistRepository.save(new Shortlist(need)));
        return toResponse(shortlist);
    }

    @Override
    public ShortlistExecutiveItem addExecutive(UUID needId, AddExecutiveRequest req) {
        Need need = findNeed(needId);
        validateNeedEditable(need);

        Shortlist shortlist = shortlistRepository.findByNeed(need)
            .orElseGet(() -> shortlistRepository.save(new Shortlist(need)));

        if (itemRepository.countByShortlist(shortlist) >= MAX_EXECUTIVES) {
            throw new BusinessRuleException("Shortlist já possui o máximo de " + MAX_EXECUTIVES + " executivos.");
        }

        var profile = profileRepository.findById(req.executiveProfileId())
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));

        // Detectar conflito usando setor da necessidade como proxy do CNAE
        // No MVP, o setor da empresa PME é usado como texto; CNAE real virá no Epic 5
        var conflictResult = conflictService.check(
            profile.getId(), "00", need.getCompany().getSector().substring(0, 2).toLowerCase()
        );

        ConflictStatus conflictStatus = conflictResult == ConflictDetectionService.ConflictResult.CONFLICT
            ? ConflictStatus.PENDING_REVIEW
            : ConflictStatus.CLEAR;

        var item = new ShortlistExecutive(shortlist, profile, conflictStatus);
        itemRepository.save(item);
        log.info("Executivo [{}] adicionado à shortlist [{}] com conflito [{}]",
            profile.getId(), shortlist.getId(), conflictStatus);

        return toItem(item);
    }

    @Override
    public void removeExecutive(UUID needId, UUID itemId) {
        Need need = findNeed(needId);
        validateNeedEditable(need);
        ShortlistExecutive item = itemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Executivo não encontrado na shortlist."));
        itemRepository.delete(item);
    }

    @Override
    public ShortlistResponse decideConflict(UUID itemId, String decision, UUID adminUserId) {
        ShortlistExecutive item = itemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Item da shortlist não encontrado."));

        ConflictStatus newStatus = switch (decision.toUpperCase()) {
            case "EXCLUDE"           -> ConflictStatus.EXCLUDED;
            case "APPROVE_WITH_ALERT" -> ConflictStatus.APPROVED_WITH_ALERT;
            default -> throw new InvalidRequestException("Decisão inválida: " + decision);
        };

        item.setConflictStatus(newStatus);
        item.setConflictDecidedBy(adminUserId);
        item.setConflictDecidedAt(Instant.now());
        itemRepository.save(item);
        log.info("Conflito do item [{}] decidido como [{}] pelo admin [{}]", itemId, newStatus, adminUserId);

        return toResponse(item.getShortlist());
    }

    @Override
    public ShortlistResponse send(UUID needId, UUID adminUserId) {
        Need need = findNeed(needId);
        Shortlist shortlist = shortlistRepository.findByNeed(need)
            .orElseThrow(() -> new ResourceNotFoundException("Shortlist não encontrada."));

        // Validar: nenhum PENDING_REVIEW
        boolean hasPendingConflict = shortlist.getExecutives().stream()
            .anyMatch(e -> e.getConflictStatus() == ConflictStatus.PENDING_REVIEW);
        if (hasPendingConflict) {
            throw new BusinessRuleException("Resolva todos os conflitos pendentes antes de enviar.");
        }

        // Validar: ≥ 2 executivos não-EXCLUDED
        long activeCount = shortlist.getExecutives().stream()
            .filter(e -> e.getConflictStatus() != ConflictStatus.EXCLUDED)
            .count();
        if (activeCount < 2) {
            throw new BusinessRuleException("A shortlist precisa de pelo menos 2 executivos para ser enviada.");
        }

        shortlist.setStatus(ShortlistStatus.SENT);
        need.setStatus(NeedStatus.SHORTLIST_SENT);
        needRepository.save(need);
        shortlistRepository.save(shortlist);

        // E-mail para a PME
        try {
            emailService.sendShortlistSent(
                need.getCompany().getResponsibleEmail(),
                need.getCompany().getLegalName()
            );
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail shortlist-sent: {}", e.getClass().getSimpleName());
        }

        log.info("Shortlist [{}] enviada para necessidade [{}]", shortlist.getId(), needId);
        return toResponse(shortlist);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Need findNeed(UUID needId) {
        return needRepository.findById(needId)
            .orElseThrow(() -> new ResourceNotFoundException("Necessidade não encontrada."));
    }

    private void validateNeedEditable(Need need) {
        var blocked = List.of(NeedStatus.SHORTLIST_SENT, NeedStatus.IN_MEDIATION, NeedStatus.CONTRACTED);
        if (blocked.contains(need.getStatus())) {
            throw new BusinessRuleException("Shortlist não pode ser editada — necessidade em status " + need.getStatus());
        }
    }

    private ShortlistResponse toResponse(Shortlist s) {
        var items = s.getExecutives().stream().map(this::toItem).toList();
        boolean canSend = !items.isEmpty()
            && items.stream().noneMatch(i -> "PENDING_REVIEW".equals(i.conflictStatus()))
            && items.stream().filter(i -> !"EXCLUDED".equals(i.conflictStatus())).count() >= 2;
        return new ShortlistResponse(s.getId(), s.getNeed().getId(), s.getStatus().name(), items, canSend);
    }

    private ShortlistExecutiveItem toItem(ShortlistExecutive e) {
        var profile = e.getExecutiveProfile();
        var specialties = profile.getSpecialties().stream()
            .map(sp -> sp.getSpecialty().name()).toList();
        String detail = switch (e.getConflictStatus()) {
            case PENDING_REVIEW      -> "Sobreposição detectada. Revisão necessária.";
            case APPROVED_WITH_ALERT -> "Apresentado com alerta de sobreposição.";
            case EXCLUDED            -> "Excluído da shortlist.";
            default                  -> null;
        };
        return new ShortlistExecutiveItem(
            e.getId(), profile.getId(),
            profile.getUser() != null ? profile.getUser().getEmail() : "",
            specialties, profile.getAvailabilityDaysPerMonth(),
            e.getConflictStatus().name(), detail
        );
    }
}
