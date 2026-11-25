package com.smartparking.model;

import java.math.BigDecimal;

/**
 * STANDARD = normal car          (2x1 bay, horizontal or vertical)
 * EV_CAR   = electric car        (2x1 bay, horizontal or vertical)
 * DISABLED = accessible car bay  (2x1 bay, kept in its own accessible zone)
 * BIKE     = normal bike         (1x1 bay)
 * EV_BIKE  = electric bike       (1x1 bay)
 */
public enum SlotType {
    //        price x   car-size (2 cells)  electric
    STANDARD ("1.0",    true,               false),
    EV_CAR   ("1.5",    true,               true),
    DISABLED ("1.0",    true,               false),
    BIKE     ("0.5",    false,              false),
    EV_BIKE  ("0.75",   false,              true);

    private final BigDecimal multiplier;
    private final boolean car;
    private final boolean electric;

    SlotType(String m, boolean car, boolean electric) {
        this.multiplier = new BigDecimal(m);
        this.car = car;
        this.electric = electric;
    }

    public BigDecimal multiplier() { return multiplier; }
    public boolean isCar() { return car; }
    public boolean isElectric() { return electric; }
}
