package com.smartparking.repository;
import com.smartparking.model.CellKind; import com.smartparking.model.Slot; import jakarta.persistence.LockModeType; import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.data.jpa.repository.Lock; import org.springframework.data.jpa.repository.Query; import java.util.List; import java.util.Optional;
public interface SlotRepository extends JpaRepository<Slot, Long> {
 List<Slot> findByLotIdAndFloorNumberOrderByRowIdxAscColIdxAsc(Long lotId,int floorNumber);
 List<Slot> findByLotIdOrderByFloorNumberAscRowIdxAscColIdxAsc(Long lotId);
 long countByKind(CellKind kind);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from Slot s where s.id = :id") Optional<Slot> findByIdForUpdate(Long id);
}
