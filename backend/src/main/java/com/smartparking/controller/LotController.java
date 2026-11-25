package com.smartparking.controller;

import com.smartparking.dto.Dtos.*;
import com.smartparking.service.LotService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/lots")
public class LotController {
    private final LotService lots;
    public LotController(LotService lots) { this.lots = lots; }

    @GetMapping
    public List<LotDto> list() { return lots.all(); }

    @GetMapping("/{id}")
    public LotDto one(@PathVariable Long id) { return lots.toDto(lots.get(id)); }

    @GetMapping("/{id}/availability")
    public AvailabilityResponse availability(@PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return lots.availability(id, start, end);
    }

    @GetMapping("/{id}/suggest")
    public SlotAvailability suggest(@PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "STANDARD") String type) {
        return lots.suggest(id, start, end, type);
    }
}
