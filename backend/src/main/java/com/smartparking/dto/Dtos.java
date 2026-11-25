package com.smartparking.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class Dtos {
    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email,
            @Size(min = 6, message = "Password must be at least 6 characters") String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String token, Long id, String name, String email, String role) {}

    public record LotRequest(@NotBlank String name, String address,
                             @Min(1) @Max(26) int rows, @Min(1) @Max(30) int cols,
                             @NotNull @DecimalMin("0.0") BigDecimal hourlyRate) {}

    // orientation: "HORIZONTAL" (2 wide x 1 tall) or "VERTICAL" (1 wide x 2 tall); car bays only
    public record CellDto(int row, int col, String kind, String type, String label,
                          String orientation) {}
    public record LayoutRequest(List<CellDto> cells) {}
    public record LotDto(Long id, String name, String address, int rows, int cols,
                         BigDecimal hourlyRate, int totalSlots) {}

    public record SlotAvailability(Long id, int row, int col, int rowSpan, int colSpan,
                                   String orientation, String label, String kind, String type,
                                   String status, BigDecimal price) {}
    public record AvailabilityResponse(LotDto lot, List<SlotAvailability> slots) {}

    public record BookingRequest(@NotNull Long slotId, @NotNull LocalDateTime start,
                                 @NotNull LocalDateTime end, @NotBlank String vehicleNumber) {}
    public record AdminBookingRequest(@NotNull Long slotId, @NotNull LocalDateTime start,
                                      @NotNull LocalDateTime end, @NotBlank String vehicleNumber,
                                      String userEmail, String customerName, boolean paid) {}

    public record BookingDto(Long id, Long lotId, String lotName, String slotLabel, String slotType,
                             LocalDateTime start, LocalDateTime end, BigDecimal amount,
                             String status, String paymentStatus, String vehicleNumber,
                             String customerName, String customerEmail, boolean createdByAdmin) {}

    public record Stats(long lots, long slots, long users, long bookingsToday, long activeNow,
                        BigDecimal revenue) {}
}
