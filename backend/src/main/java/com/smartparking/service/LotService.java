package com.smartparking.service;

import com.smartparking.dto.Dtos.*;
import com.smartparking.exception.ApiException;
import com.smartparking.model.*;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.LotRepository;
import com.smartparking.repository.SlotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LotService {
    private final LotRepository lots;
    private final SlotRepository slots;
    private final BookingRepository bookings;

    public LotService(LotRepository lots, SlotRepository slots, BookingRepository bookings) {
        this.lots = lots; this.slots = slots; this.bookings = bookings;
    }

    public static String defaultLabel(int r, int c) {
        return (char) ('A' + r) + String.valueOf(c + 1);
    }

    public ParkingLot get(Long id) {
        return lots.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parking lot not found"));
    }

    private boolean inBounds(ParkingLot l, Slot s) {
        return s.getRowIdx() < l.getGridRows() && s.getColIdx() < l.getGridCols();
    }

    private static String key(int r, int c) { return r + "-" + c; }

    private Map<String, Slot> slotMap(Long lotId) {
        return slots.findByLotIdOrderByRowIdxAscColIdxAsc(lotId).stream()
                .collect(Collectors.toMap(s -> key(s.getRowIdx(), s.getColIdx()), s -> s));
    }

    @Transactional(readOnly = true)
    public LotDto toDto(ParkingLot l) {
        int total = (int) slots.findByLotIdOrderByRowIdxAscColIdxAsc(l.getId()).stream()
                .filter(s -> inBounds(l, s) && s.getKind() == CellKind.SLOT).count();
        return new LotDto(l.getId(), l.getName(), l.getAddress(), l.getGridRows(),
                l.getGridCols(), l.getHourlyRate(), total);
    }

    @Transactional(readOnly = true)
    public List<LotDto> all() {
        return lots.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public LotDto create(LotRequest r) {
        ParkingLot l = new ParkingLot();
        apply(l, r);
        l = lots.save(l);
        ensureSlots(l);
        return toDto(l);
    }

    @Transactional
    public LotDto update(Long id, LotRequest r) {
        ParkingLot l = get(id);
        apply(l, r);
        lots.save(l);
        ensureSlots(l);
        return toDto(l);
    }

    private void apply(ParkingLot l, LotRequest r) {
        l.setName(r.name().trim()); l.setAddress(r.address());
        l.setGridRows(r.rows()); l.setGridCols(r.cols());
        l.setHourlyRate(r.hourlyRate().setScale(2, RoundingMode.HALF_UP));
    }

    /** Creates a default cell for every position that has none, then re-applies the bay geometry. */
    private void ensureSlots(ParkingLot l) {
        Map<String, Slot> map = slotMap(l.getId());
        for (int r = 0; r < l.getGridRows(); r++) {
            for (int c = 0; c < l.getGridCols(); c++) {
                if (!map.containsKey(key(r, c))) {
                    Slot s = new Slot();
                    s.setLot(l); s.setRowIdx(r); s.setColIdx(c); s.setLabel(defaultLabel(r, c));
                    map.put(key(r, c), s);
                }
            }
        }
        normalise(l, map, LocalDateTime.now());
        slots.saveAll(map.values());
    }

    @Transactional
    public void delete(Long id) {
        ParkingLot l = get(id);
        if (bookings.existsBySlotLotId(id))
            throw new ApiException(HttpStatus.CONFLICT, "This lot has bookings and cannot be deleted");
        lots.delete(l);
    }

    @Transactional
    public void saveLayout(Long id, List<CellDto> cells) {
        ParkingLot l = get(id);
        Map<String, Slot> map = slotMap(id);
        LocalDateTime now = LocalDateTime.now();
        for (CellDto c : cells) {
            if (c.row() < 0 || c.col() < 0) continue;
            if (c.row() >= l.getGridRows() || c.col() >= l.getGridCols()) continue;
            Slot s = map.get(key(c.row(), c.col()));
            if (s == null) {
                s = new Slot();
                s.setLot(l); s.setRowIdx(c.row()); s.setColIdx(c.col());
                map.put(key(c.row(), c.col()), s);
            }
            CellKind kind = CellKind.valueOf(c.kind());
            if (s.getId() != null && s.getKind() == CellKind.SLOT && kind != CellKind.SLOT
                    && bookings.existsBySlotIdAndStatusAndEndTimeAfter(
                            s.getId(), BookingStatus.CONFIRMED, now))
                throw new ApiException(HttpStatus.CONFLICT, "Slot " + s.getLabel()
                        + " has upcoming bookings and cannot be removed, blocked or covered");
            s.setKind(kind);
            s.setType(kind == CellKind.SLOT ? SlotType.valueOf(c.type()) : SlotType.STANDARD);
            s.setOrientation("VERTICAL".equals(c.orientation())
                    ? Orientation.VERTICAL : Orientation.HORIZONTAL);
            boolean noLabel = c.label() == null || c.label().isBlank();
            s.setLabel(noLabel ? defaultLabel(c.row(), c.col()) : c.label().trim());
        }
        normalise(l, map, now);
        slots.saveAll(map.values());
    }

    /**
     * The one place that enforces the bay geometry. Scans the grid row by row, left to right:
     *  - a car bay (STANDARD / EV_CAR / DISABLED) owns its own cell AND one neighbour:
     *      HORIZONTAL -> the cell on its right (2 wide x 1 tall)
     *      VERTICAL   -> the cell below        (1 wide x 2 tall)
     *    The neighbour becomes COVERED.
     *  - a car bay that does not fit (grid edge, or neighbour already taken) becomes an AISLE
     *  - a bike bay (BIKE / EV_BIKE) is a single cell (1x1)
     *  - a COVERED cell that no bay claimed goes back to being an AISLE
     */
    private void normalise(ParkingLot l, Map<String, Slot> map, LocalDateTime now) {
        Set<String> covered = new HashSet<>();
        for (int r = 0; r < l.getGridRows(); r++) {
            for (int c = 0; c < l.getGridCols(); c++) {
                String k = key(r, c);
                Slot s = map.get(k);
                if (s == null || covered.contains(k)) continue;
                boolean carBay = s.getKind() == CellKind.SLOT && s.getType().isCar();
                if (carBay) {
                    if (s.getOrientation() == null) s.setOrientation(Orientation.HORIZONTAL);
                    boolean vertical = s.getOrientation() == Orientation.VERTICAL;
                    int r2 = vertical ? r + 1 : r;
                    int c2 = vertical ? c : c + 1;
                    String k2 = key(r2, c2);
                    boolean inside = r2 < l.getGridRows() && c2 < l.getGridCols();
                    Slot second = inside ? map.get(k2) : null;
                    if (second != null && !covered.contains(k2)) {
                        s.setRowSpan(vertical ? 2 : 1);
                        s.setColSpan(vertical ? 1 : 2);
                        retire(second, CellKind.COVERED, now);
                        covered.add(k2);
                        continue;
                    }
                    retire(s, CellKind.AISLE, now);      // no room for a 2-cell bay here
                    s.setRowSpan(1); s.setColSpan(1);
                } else {
                    if (s.getKind() == CellKind.COVERED) s.setKind(CellKind.AISLE);  // orphan
                    s.setRowSpan(1); s.setColSpan(1);
                }
            }
        }
    }

    /** Turns a cell into COVERED/AISLE, refusing if it still has upcoming bookings. */
    private void retire(Slot s, CellKind to, LocalDateTime now) {
        if (s.getKind() == to) return;
        if (s.getId() != null && s.getKind() == CellKind.SLOT
                && bookings.existsBySlotIdAndStatusAndEndTimeAfter(
                        s.getId(), BookingStatus.CONFIRMED, now))
            throw new ApiException(HttpStatus.CONFLICT, "Slot " + s.getLabel()
                    + " has upcoming bookings and cannot be covered by a car bay");
        s.setKind(to); s.setType(SlotType.STANDARD); s.setRowSpan(1); s.setColSpan(1);
    }

    public BigDecimal slotRate(ParkingLot l, Slot s) {
        return l.getHourlyRate().multiply(s.getType().multiplier()).setScale(2, RoundingMode.HALF_UP);
    }

    /** Grid with live status. Without start/end every bay shows as AVAILABLE (designer). */
    @Transactional(readOnly = true)
    public AvailabilityResponse availability(Long lotId, LocalDateTime start, LocalDateTime end) {
        ParkingLot l = get(lotId);
        boolean timed = start != null && end != null;
        Set<Long> taken = timed
                ? bookings.findActiveOverlapping(lotId, start, end).stream()
                        .map(b -> b.getSlot().getId()).collect(Collectors.toSet())
                : Set.of();
        List<SlotAvailability> out = new ArrayList<>();
        for (Slot s : slots.findByLotIdOrderByRowIdxAscColIdxAsc(lotId)) {
            if (!inBounds(l, s)) continue;
            String status = s.getKind() != CellKind.SLOT ? s.getKind().name()   // AISLE/BLOCKED/COVERED
                    : taken.contains(s.getId()) ? "BOOKED" : "AVAILABLE";
            BigDecimal price = timed ? BookingService.price(l, s, start, end) : slotRate(l, s);
            String dir = s.getOrientation() == null ? "HORIZONTAL" : s.getOrientation().name();
            out.add(new SlotAvailability(s.getId(), s.getRowIdx(), s.getColIdx(),
                    s.getRowSpan(), s.getColSpan(), dir, s.getLabel(),
                    s.getKind().name(), s.getType().name(), status, price));
        }
        return new AvailabilityResponse(toDto(l), out);
    }

    /** Best spot = free bay of the requested type closest to the entrance (top-centre). */
    @Transactional(readOnly = true)
    public SlotAvailability suggest(Long lotId, LocalDateTime start, LocalDateTime end, String type) {
        AvailabilityResponse a = availability(lotId, start, end);
        int mid = a.lot().cols() / 2;
        return a.slots().stream()
                .filter(s -> s.status().equals("AVAILABLE") && s.type().equals(type))
                .min(Comparator.comparingInt(s -> s.row() * 2 + Math.abs(s.col() - mid)))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No free slot of that type for that time"));
    }
}
