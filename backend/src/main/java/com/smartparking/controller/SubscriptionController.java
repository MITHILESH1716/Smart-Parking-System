package com.smartparking.controller;
import com.smartparking.dto.Dtos.*; import com.smartparking.exception.ApiException; import com.smartparking.model.User; import com.smartparking.repository.UserRepository; import com.smartparking.service.SubscriptionService; import jakarta.validation.Valid; import org.springframework.http.HttpStatus; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/subscriptions") public class SubscriptionController {
 private final SubscriptionService service; private final UserRepository users;
 public SubscriptionController(SubscriptionService service,UserRepository users){this.service=service;this.users=users;}
 private User me(Authentication a){return users.findByEmailIgnoreCase(a.getName()).orElseThrow(()->new ApiException(HttpStatus.UNAUTHORIZED,"Unknown user"));}
 @GetMapping("/plans") public List<TierDto> plans(){return service.tiers();}
 @GetMapping("/current") public SubscriptionDto current(Authentication a){return service.current(me(a));}
 @GetMapping("/history") public List<SubscriptionDto> history(Authentication a){return service.history(me(a));}
 @PostMapping("/purchase") public SubscriptionDto purchase(@Valid @RequestBody PurchaseRequest r,Authentication a){return service.purchase(me(a),r.tier());}
}
