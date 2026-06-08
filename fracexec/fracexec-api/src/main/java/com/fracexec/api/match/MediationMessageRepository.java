package com.fracexec.api.match;

import com.fracexec.api.company.Need;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MediationMessageRepository extends JpaRepository<MediationMessage, UUID> {
    List<MediationMessage> findAllByNeedOrderByCreatedAtAsc(Need need);
}
