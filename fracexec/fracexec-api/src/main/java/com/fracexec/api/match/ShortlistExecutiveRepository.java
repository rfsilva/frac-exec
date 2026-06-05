package com.fracexec.api.match;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ShortlistExecutiveRepository extends JpaRepository<ShortlistExecutive, UUID> {
    long countByShortlist(Shortlist shortlist);
}
