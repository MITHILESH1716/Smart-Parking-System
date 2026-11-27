package com.smartparking.model;
import jakarta.persistence.*; import lombok.Getter; import lombok.NoArgsConstructor; import lombok.Setter; import java.time.LocalDateTime; import java.math.BigDecimal;
@Entity @Table(name="user_subscriptions") @Getter @Setter @NoArgsConstructor
public class UserSubscription { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(optional=false,fetch=FetchType.LAZY) private User user; @ManyToOne(optional=false,fetch=FetchType.EAGER) private SubscriptionPlan plan; @Column(nullable=false) private LocalDateTime startsAt; @Column(nullable=false) private LocalDateTime endsAt; @Column(nullable=false) private String status="ACTIVE"; @Column(nullable=false,precision=10,scale=2) private BigDecimal pricePaid=BigDecimal.ZERO; }
