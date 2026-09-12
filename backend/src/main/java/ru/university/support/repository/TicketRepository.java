package ru.university.support.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.university.support.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
}
