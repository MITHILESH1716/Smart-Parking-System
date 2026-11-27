package com.smartparking.controller;

import com.smartparking.dto.Dtos.*;
import com.smartparking.model.Role;
import com.smartparking.repository.UserRepository;
import com.smartparking.service.BookingService;
import com.smartparking.service.LotService;
import com.smartparking.service.SubscriptionService;
import java.math.BigDecimal;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final LotService lots;
    private final BookingService bookings;
    private final UserRepository users;
    private final SubscriptionService subscriptions;

    public AdminController(LotService lots, BookingService bookings, UserRepository users, SubscriptionService subscriptions) {
        this.lots = lots; this.bookings = bookings; this.users = users; this.subscriptions = subscriptions;
    }

    @GetMapping("/stats")
    public Stats stats() { return bookings.stats(lots.all().size(), users.countByRole(Role.USER)); }

    @PostMapping("/lots")
    public LotDto createLot(@Valid @RequestBody LotRequest r) { return lots.create(r); }

    @PutMapping("/lots/{id}")
    public LotDto updateLot(@PathVariable Long id, @Valid @RequestBody LotRequest r) { return lots.update(id, r); }

    @DeleteMapping("/lots/{id}")
    public Map<String, String> deleteLot(@PathVariable Long id) { lots.delete(id); return Map.of("message", "Deleted"); }

    @PutMapping("/lots/{id}/layout")
    public Map<String, String> layout(@PathVariable Long id, @RequestBody LayoutRequest r) {
        lots.saveLayout(id, r.floor(), r.cells()); return Map.of("message", "Layout saved");
    }

    @GetMapping("/subscription-plans")
    public List<TierDto> plans() { return subscriptions.tiers(); }

    @PutMapping("/subscription-plans/{code}")
    public TierDto price(@PathVariable String code, @RequestBody Map<String, BigDecimal> body) { return subscriptions.price(code, body.get("price")); }

    @GetMapping("/bookings")
    public List<BookingDto> allBookings() { return bookings.all(); }

    /** Admin books a bay for a registered user (by email) or a walk-in customer. */
    @PostMapping("/bookings")
    public BookingDto book(@Valid @RequestBody AdminBookingRequest r) { return bookings.adminCreate(r); }

    @PostMapping("/bookings/{id}/complete")
    public BookingDto complete(@PathVariable Long id) { return bookings.complete(id); }
}
