package com.fracexec.api.match;

import com.fracexec.api.company.Need;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShortlistRepository extends JpaRepository<Shortlist, UUID> {
    Optional<Shortlist> findByNeed(Need need);
}
