package com.smartparking.repository;

import com.smartparking.model.Booking;
import com.smartparking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("select b from Booking b where b.slot.lot.id = :lotId and b.status = com.smartparking.model.BookingStatus.CONFIRMED " +
           "and b.startTime < :end and b.endTime > :start")
    List<Booking> findActiveOverlapping(Long lotId, LocalDateTime start, LocalDateTime end);

    @Query("select count(b) > 0 from Booking b where b.slot.id = :slotId and b.status = com.smartparking.model.BookingStatus.CONFIRMED " +
           "and b.startTime < :end and b.endTime > :start")
    boolean slotTaken(Long slotId, LocalDateTime start, LocalDateTime end);

    boolean existsBySlotIdAndStatusAndEndTimeAfter(Long slotId, BookingStatus status, LocalDateTime time);
    boolean existsBySlotLotId(Long lotId);

    List<Booking> findByUserIdOrderByStartTimeDesc(Long userId);
    List<Booking> findAllByOrderByStartTimeDesc();

    long countByStatusAndStartTimeBetween(BookingStatus status, LocalDateTime from, LocalDateTime to);

    @Query("select count(b) from Booking b where b.status = com.smartparking.model.BookingStatus.CONFIRMED " +
           "and b.startTime <= :now and b.endTime > :now")
    long countActiveAt(LocalDateTime now);

    @Query("select coalesce(sum(b.amount), 0) from Booking b where b.paymentStatus = com.smartparking.model.PaymentStatus.PAID " +
           "and b.status <> com.smartparking.model.BookingStatus.CANCELLED")
    BigDecimal totalRevenue();
}
