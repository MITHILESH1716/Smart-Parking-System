package com.smartparking.config;

import com.smartparking.dto.Dtos.CellDto;
import com.smartparking.dto.Dtos.LotDto;
import com.smartparking.dto.Dtos.LotRequest;
import com.smartparking.model.Role;
import com.smartparking.model.User;
import com.smartparking.repository.UserRepository;
import com.smartparking.service.LotService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Creates a default admin, a demo user and a demo parking lot on first start. */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final LotService lots;
    private final com.smartparking.service.SubscriptionService subscriptions;

    public DataSeeder(UserRepository users, PasswordEncoder encoder, LotService lots, com.smartparking.service.SubscriptionService subscriptions) {
        this.users = users; this.encoder = encoder; this.lots = lots; this.subscriptions = subscriptions;
    }

    @Override
    public void run(String... args) {
        subscriptions.seed();
        if (!users.existsByEmailIgnoreCase("admin@smartpark.com")) {
            User a = new User();
            a.setName("Parking Admin"); a.setEmail("admin@smartpark.com");
            a.setPassword(encoder.encode("Admin@123")); a.setRole(Role.ADMIN);
            users.save(a);
        }
        if (!users.existsByEmailIgnoreCase("user@smartpark.com")) {
            User u = new User();
            u.setName("Demo User"); u.setEmail("user@smartpark.com");
            u.setPassword(encoder.encode("User@123")); u.setRole(Role.USER);
            users.save(u);
        }
        if (lots.all().isEmpty()) {
            int rows = 7, cols = 12;
            LotDto lot = lots.create(new LotRequest("Central Mall Parking", "MG Road, Bengaluru",
                    rows, cols, 1, new BigDecimal("40")));

            String[][] kind = new String[rows][cols];
            String[][] type = new String[rows][cols];
            String[][] dir = new String[rows][cols];
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    kind[r][c] = "AISLE";
                    type[r][c] = "STANDARD";
                    dir[r][c] = "HORIZONTAL";
                }
            }

            // Car zone, horizontal bays (2 wide x 1 tall): rows 0-1, columns 0-5.
            // Row 0 has electric bays.
            for (int r = 0; r <= 1; r++)
                for (int c = 0; c <= 4; c += 2)
                    bay(kind, type, dir, r, c, (r == 0 && c < 4) ? "EV_CAR" : "STANDARD", false);

            // Car zone, vertical bays (1 wide x 2 tall): rows 3-4, columns 0-5.
            for (int c = 0; c <= 5; c++)
                bay(kind, type, dir, 3, c, c < 2 ? "EV_CAR" : "STANDARD", true);

            // Bike zone (1x1): columns 7-10, rows 0-2. Row 0 has electric bikes.
            for (int r = 0; r <= 2; r++)
                for (int c = 7; c <= 10; c++)
                    bay(kind, type, dir, r, c, r == 0 ? "EV_BIKE" : "BIKE", false);

            // Accessible and elderly-friendly zones: row 6.
            bay(kind, type, dir, 6, 6, "ELDERLY", false);
            // Accessible zone (its own section): row 6, three horizontal bays.
            for (int c = 0; c <= 4; c += 2)
                bay(kind, type, dir, 6, c, "DISABLED", false);

            List<CellDto> cells = new ArrayList<>();
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    String label = kind[r][c].equals("SLOT") ? LotService.defaultLabel(r, c) : "";
                    cells.add(new CellDto(1, r, c, kind[r][c], type[r][c], label, dir[r][c]));
                }
            }
            lots.saveLayout(lot.id(), 1, cells);
        }
    }

    /** Places one bay. Car-size types also mark the second cell as COVERED. */
    private static void bay(String[][] kind, String[][] type, String[][] dir,
                            int r, int c, String t, boolean vertical) {
        kind[r][c] = "SLOT";
        type[r][c] = t;
        dir[r][c] = vertical ? "VERTICAL" : "HORIZONTAL";
        boolean car = t.equals("STANDARD") || t.equals("EV_CAR") || t.equals("DISABLED") || t.equals("ELDERLY");
        if (car) {
            if (vertical) kind[r + 1][c] = "COVERED";
            else kind[r][c + 1] = "COVERED";
        }
    }
}

