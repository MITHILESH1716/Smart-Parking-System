package com.smartparking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter @Setter @NoArgsConstructor
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;                 // null for walk-in customers booked by an admin
    private String customerName;
    private String vehicleNumber;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Slot slot;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    @Column(precision = 10, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) private BookingStatus status = BookingStatus.CONFIRMED;
    @Enumerated(EnumType.STRING) private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private boolean createdByAdmin;
    private LocalDateTime createdAt = LocalDateTime.now();
}
