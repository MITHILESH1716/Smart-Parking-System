package com.smartparking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parking_lots")
@Getter @Setter @NoArgsConstructor
public class ParkingLot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String address;
    private int gridRows;
    private int gridCols;
    @Column(nullable = false, columnDefinition = "integer default 1")
    private int floorCount = 1;
    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate;
    @OneToMany(mappedBy = "lot", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Slot> slots = new ArrayList<>();
}
