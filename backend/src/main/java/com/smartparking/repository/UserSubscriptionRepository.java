package com.smartparking.repository;
import com.smartparking.model.UserSubscription; import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.data.jpa.repository.Query; import java.math.BigDecimal; import java.time.LocalDateTime; import java.util.List; import java.util.Optional;
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription,Long> {
 List<UserSubscription> findByUserIdOrderByEndsAtDesc(Long userId);
 Optional<UserSubscription> findFirstByUserIdAndStatusAndStartsAtLessThanEqualAndEndsAtGreaterThanEqualOrderByEndsAtDesc(Long userId,String status,LocalDateTime start,LocalDateTime end);
 @Query("select coalesce(sum(s.pricePaid), 0) from UserSubscription s") BigDecimal totalRevenue();
}
