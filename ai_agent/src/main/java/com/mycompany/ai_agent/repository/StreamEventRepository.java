package com.mycompany.ai_agent.repository;

import com.mycompany.ai_agent.entity.StreamEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StreamEventRepository extends JpaRepository<StreamEvent, Long> {
}