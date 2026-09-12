package com.mycompany.ai_agent.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Entity
@Table(name = "requests")

@Getter
@Setter
@NoArgsConstructor
public class Request {

    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "request_generator")
    @SequenceGenerator(
            name = "request_generator",
            sequenceName = "request_seq",
            allocationSize = 1
    )
    @Id
    Long id;

    @Column(nullable = false)
    String user_uid;

    @Column(nullable = false)
    String title;

    @Column(nullable = false)
    String description;

    @Column(nullable = false)
    String category;

    @Column(nullable = false)
    String status;

}
