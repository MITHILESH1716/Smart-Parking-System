package com.smartparking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "slots",
       uniqueConstraints = @UniqueConstraint(columnNames = {"lot_id", "row_idx", "col_idx"}))
@Getter @Setter @NoArgsConstructor
public class Slot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id")
    private ParkingLot lot;
    @Column(name = "row_idx") private int rowIdx;
    @Column(name = "col_idx") private int colIdx;
    /** Cells covered. Car bays: 2x1 (horizontal) or 1x2 (vertical). Everything else: 1x1. */
    @Column(name = "row_span") private int rowSpan = 1;
    @Column(name = "col_span") private int colSpan = 1;
    @Enumerated(EnumType.STRING) private Orientation orientation = Orientation.HORIZONTAL;
    private String label;
    @Enumerated(EnumType.STRING) private CellKind kind = CellKind.SLOT;
    @Enumerated(EnumType.STRING) private SlotType type = SlotType.STANDARD;
}
