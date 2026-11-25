package com.smartparking.controller;

import com.smartparking.dto.Dtos.*;
import com.smartparking.exception.ApiException;
import com.smartparking.model.User;
import com.smartparking.repository.UserRepository;
import com.smartparking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;
    private final UserRepository users;

    public BookingController(BookingService service, UserRepository users) { this.service = service; this.users = users; }

    private User me(Authentication a) {
        return users.findByEmailIgnoreCase(a.getName()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unknown user"));
    }

    @PostMapping
    public BookingDto create(@Valid @RequestBody BookingRequest r, Authentication a) {
        User u = me(a);
        return service.create(u, u.getName(), false, false, r.slotId(), r.start(), r.end(), r.vehicleNumber());
    }

    @GetMapping("/my")
    public List<BookingDto> mine(Authentication a) { return service.forUser(me(a).getId()); }

    @PostMapping("/{id}/pay")
    public BookingDto pay(@PathVariable Long id, Authentication a) { return service.pay(id, me(a)); }

    @DeleteMapping("/{id}")
    public BookingDto cancel(@PathVariable Long id, Authentication a) { return service.cancel(id, me(a)); }
}
