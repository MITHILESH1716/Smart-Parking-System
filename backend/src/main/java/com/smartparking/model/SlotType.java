package com.smartparking.model;

import java.math.BigDecimal;

/** Physical bay categories with the default display footprint (width x length, metres). */
public enum SlotType {
    STANDARD("1.0", true, false, "2.75", "5.00", "Shared car bay"),
    EV_CAR("1.5", true, true, "2.75", "5.00", "Shared car bay"),
    DISABLED("1.0", true, false, "3.60", "5.00", "Includes a 1.20 m side transfer zone"),
    ELDERLY("1.0", true, false, "2.75", "5.00", "Shared car bay"),
    BIKE("0.5", false, false, "1.25", "1.00", "1.25 m² minimum area; shown as a 1.25 m x 1.00 m footprint"),
    EV_BIKE("0.75", false, true, "1.25", "1.00", "1.25 m² minimum area; shown as a 1.25 m x 1.00 m footprint");

    private final BigDecimal multiplier;
    private final boolean car;
    private final boolean electric;
    private final BigDecimal bayWidthMeters;
    private final BigDecimal bayLengthMeters;
    private final String dimensionsNote;

    SlotType(String multiplier, boolean car, boolean electric, String width, String length, String note) {
        this.multiplier = new BigDecimal(multiplier);
        this.car = car;
        this.electric = electric;
        this.bayWidthMeters = new BigDecimal(width);
        this.bayLengthMeters = new BigDecimal(length);
        this.dimensionsNote = note;
    }

    public BigDecimal multiplier() { return multiplier; }
    public boolean isCar() { return car; }
    public boolean isElectric() { return electric; }
    public BigDecimal bayWidthMeters() { return bayWidthMeters; }
    public BigDecimal bayLengthMeters() { return bayLengthMeters; }
    public BigDecimal bayAreaSqMeters() { return bayWidthMeters.multiply(bayLengthMeters).stripTrailingZeros(); }
    public String dimensionsNote() { return dimensionsNote; }
}
