package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.AiRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AiRunRepository extends JpaRepository<AiRun, UUID> {
}