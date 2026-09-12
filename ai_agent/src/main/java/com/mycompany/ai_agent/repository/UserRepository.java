package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}