package com.mycompany.ai_agent.controller;

import com.mycompany.ai_agent.dto.AttachmentResponse;
import com.mycompany.ai_agent.service.AttachmentService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new AttachmentResponse(attachmentService.upload(file)));
    }

    @GetMapping("/{attachmentId}")
    public ResponseEntity<?> download(@PathVariable UUID attachmentId) {
        AttachmentService.DownloadedAttachment attachment = attachmentService.download(attachmentId);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(attachment.name(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(attachment.resource());
    }
}
