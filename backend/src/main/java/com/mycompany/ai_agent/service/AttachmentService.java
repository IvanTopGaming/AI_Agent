package com.mycompany.ai_agent.service;

import com.mycompany.ai_agent.dto.AttachmentDto;
import com.mycompany.ai_agent.entity.Attachment;
import com.mycompany.ai_agent.exception.ApiException;
import com.mycompany.ai_agent.repository.AttachmentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final Path storagePath;

    public AttachmentService(
            AttachmentRepository attachmentRepository,
            @Value("${app.attachments.path}") String storagePath
    ) {
        this.attachmentRepository = attachmentRepository;
        this.storagePath = Path.of(storagePath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void initialize() throws IOException {
        Files.createDirectories(storagePath);
    }

    @Transactional
    public AttachmentDto upload(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Файл пуст");
        }

        String storageKey = UUID.randomUUID().toString();
        Path destination = storagePath.resolve(storageKey);
        String checksum;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = new DigestInputStream(file.getInputStream(), digest)) {
                Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            checksum = HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORAGE_ERROR", "Не удалось сохранить файл");
        }

        Attachment attachment = new Attachment();
        attachment.setStorageKey(storageKey);
        attachment.setOriginalName(safeName(file.getOriginalFilename()));
        attachment.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
        attachment.setSizeBytes(file.getSize());
        attachment.setChecksumSha256(checksum);
        attachment.setCreatedAt(OffsetDateTime.now());
        return toDto(attachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public List<Attachment> getAll(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Attachment> attachments = attachmentRepository.findAllById(ids);
        if (attachments.size() != ids.stream().distinct().count()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ATTACHMENT_NOT_FOUND", "Одно или несколько вложений не найдены");
        }
        return attachments;
    }

    @Transactional(readOnly = true)
    public DownloadedAttachment download(UUID id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ATTACHMENT_NOT_FOUND", "Вложение не найдено"));
        try {
            Resource resource = new UrlResource(storagePath.resolve(attachment.getStorageKey()).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ApiException(HttpStatus.NOT_FOUND, "ATTACHMENT_NOT_FOUND", "Файл вложения не найден");
            }
            return new DownloadedAttachment(resource, attachment.getOriginalName(), attachment.getContentType());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORAGE_ERROR", "Не удалось прочитать файл");
        }
    }

    public AttachmentDto toDto(Attachment attachment) {
        return new AttachmentDto(
                attachment.getId(),
                attachment.getOriginalName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                "/api/v1/attachments/" + attachment.getId()
        );
    }

    private String safeName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "file";
        }
        return Path.of(originalName).getFileName().toString();
    }

    public record DownloadedAttachment(Resource resource, String name, String contentType) {
    }
}
