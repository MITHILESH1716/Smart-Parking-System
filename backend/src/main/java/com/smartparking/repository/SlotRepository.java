package com.smartparking.repository;

import com.smartparking.model.CellKind;
import com.smartparking.model.Slot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByLotIdOrderByRowIdxAscColIdxAsc(Long lotId);
    long countByKind(CellKind kind);

    /** Row lock so two people cannot book the same bay at the same moment. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Slot s where s.id = :id")
    Optional<Slot> findByIdForUpdate(Long id);
}
