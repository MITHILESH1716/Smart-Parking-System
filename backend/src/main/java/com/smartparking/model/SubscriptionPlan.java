package com.smartparking.model;
import jakarta.persistence.*; import lombok.Getter; import lombok.NoArgsConstructor; import lombok.Setter; import java.math.BigDecimal;
@Entity @Table(name="subscription_plans") @Getter @Setter @NoArgsConstructor
public class SubscriptionPlan { @Id @Column(length=20) private String code; @Column(nullable=false) private String name; @Column(nullable=false) private String intervalLabel; @Column(nullable=false) private int days; @Column(nullable=false,precision=10,scale=2) private BigDecimal price; }
