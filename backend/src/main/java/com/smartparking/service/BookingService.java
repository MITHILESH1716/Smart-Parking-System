package com.smartparking.service;

import com.smartparking.dto.Dtos.*;
import com.smartparking.exception.ApiException;
import com.smartparking.model.*;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.SlotRepository;
import com.smartparking.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private final BookingRepository bookings;
    private final SlotRepository slots;
    private final UserRepository users;

    public BookingService(BookingRepository bookings, SlotRepository slots, UserRepository users) {
        this.bookings = bookings; this.slots = slots; this.users = users;
    }

    /** Hourly billing: every started hour is charged, minimum one hour. */
    public static BigDecimal price(ParkingLot lot, Slot slot, LocalDateTime s, LocalDateTime e) {
        long mins = Duration.between(s, e).toMinutes();
        long hours = Math.max(1, (mins + 59) / 60);
        return lot.getHourlyRate().multiply(slot.getType().multiplier())
                .multiply(BigDecimal.valueOf(hours)).setScale(2, RoundingMode.HALF_UP);
    }

    private void validateTimes(LocalDateTime s, LocalDateTime e) {
        if (!e.isAfter(s)) throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        if (s.isBefore(LocalDateTime.now().truncatedTo(ChronoUnit.HOURS)))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start time is in the past");
        if (Duration.between(s, e).toHours() > 24)
            throw new ApiException(HttpStatus.BAD_REQUEST, "A booking can be at most 24 hours");
    }

    @Transactional
    public BookingDto create(User user, String customerName, boolean byAdmin, boolean paid,
                             Long slotId, LocalDateTime s, LocalDateTime e, String vehicle) {
        validateTimes(s, e);
        Slot slot = slots.findByIdForUpdate(slotId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Slot not found"));
        if (slot.getKind() != CellKind.SLOT) throw new ApiException(HttpStatus.BAD_REQUEST, "This cell is not a bookable slot");
        if (bookings.slotTaken(slotId, s, e))
            throw new ApiException(HttpStatus.CONFLICT, "Slot " + slot.getLabel() + " was just booked for that time. Please pick another.");
        Booking b = new Booking();
        b.setUser(user);
        b.setCustomerName(customerName);
        b.setVehicleNumber(vehicle.trim().toUpperCase());
        b.setSlot(slot);
        b.setStartTime(s); b.setEndTime(e);
        b.setAmount(price(slot.getLot(), slot, s, e));
        b.setCreatedByAdmin(byAdmin);
        b.setPaymentStatus(paid ? PaymentStatus.PAID : PaymentStatus.PENDING);
        return toDto(bookings.save(b));
    }

    @Transactional
    public BookingDto adminCreate(AdminBookingRequest r) {
        User u = null;
        String name = r.customerName();
        if (r.userEmail() != null && !r.userEmail().isBlank()) {
            u = users.findByEmailIgnoreCase(r.userEmail().trim())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No registered user with that email"));
            name = u.getName();
        } else if (name == null || name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a registered user's email or a walk-in customer name");
        }
        return create(u, name, true, r.paid(), r.slotId(), r.start(), r.end(), r.vehicleNumber());
    }

    private Booking find(Long id) {
        return bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private void checkAccess(Booking b, User actor) {
        boolean admin = actor.getRole() == Role.ADMIN;
        if (!admin && (b.getUser() == null || !b.getUser().getId().equals(actor.getId())))
            throw new ApiException(HttpStatus.FORBIDDEN, "Not your booking");
    }

    @Transactional
    public BookingDto cancel(Long id, User actor) {
        Booking b = find(id);
        checkAccess(b, actor);
        if (b.getStatus() != BookingStatus.CONFIRMED) throw new ApiException(HttpStatus.BAD_REQUEST, "Only active bookings can be cancelled");
        if (actor.getRole() != Role.ADMIN && !b.getStartTime().isAfter(LocalDateTime.now()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "A booking that has already started can't be cancelled");
        b.setStatus(BookingStatus.CANCELLED);
        return toDto(b);
    }

    @Transactional
    public BookingDto pay(Long id, User actor) {
        Booking b = find(id);
        checkAccess(b, actor);
        if (b.getStatus() != BookingStatus.CONFIRMED) throw new ApiException(HttpStatus.BAD_REQUEST, "This booking is not active");
        b.setPaymentStatus(PaymentStatus.PAID);   // gateway integration (Razorpay/Stripe) would plug in here
        return toDto(b);
    }

    @Transactional
    public BookingDto complete(Long id) {
        Booking b = find(id);
        if (b.getStatus() != BookingStatus.CONFIRMED) throw new ApiException(HttpStatus.BAD_REQUEST, "Only active bookings can be checked out");
        b.setStatus(BookingStatus.COMPLETED);
        b.setPaymentStatus(PaymentStatus.PAID);
        return toDto(b);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> forUser(Long userId) {
        return bookings.findByUserIdOrderByStartTimeDesc(userId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDto> all() {
        return bookings.findAllByOrderByStartTimeDesc().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Stats stats(long lots, long users) {
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
        return new Stats(lots, slots.countByKind(CellKind.SLOT), users,
                bookings.countByStatusAndStartTimeBetween(BookingStatus.CONFIRMED, today, today.plusDays(1)),
                bookings.countActiveAt(LocalDateTime.now()), bookings.totalRevenue());
    }

    public BookingDto toDto(Booking b) {
        Slot s = b.getSlot();
        return new BookingDto(b.getId(), s.getLot().getId(), s.getLot().getName(), s.getLabel(), s.getType().name(),
                b.getStartTime(), b.getEndTime(), b.getAmount(), b.getStatus().name(), b.getPaymentStatus().name(),
                b.getVehicleNumber(), b.getCustomerName(), b.getUser() != null ? b.getUser().getEmail() : null, b.isCreatedByAdmin());
    }
}
