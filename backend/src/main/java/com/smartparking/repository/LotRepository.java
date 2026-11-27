package com.smartparking.repository;

import com.smartparking.model.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LotRepository extends JpaRepository<ParkingLot, Long> {
}
