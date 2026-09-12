package com.mycompany.ai_agent.entity;

import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;


@ToString
@Entity
@Table(name = "messages")

@Getter
@Setter
@NoArgsConstructor
public class Message {
    
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_generator")
    @SequenceGenerator(
            name = "message_generator",
            sequenceName = "message_seq",
            allocationSize = 1
    )
    @Id
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    Request request_id;

    @Column(nullable = false)
    String author;

    @Column(nullable = false)
    String body;

    @Column(nullable = false)
    LocalDateTime created_at;
    
}
