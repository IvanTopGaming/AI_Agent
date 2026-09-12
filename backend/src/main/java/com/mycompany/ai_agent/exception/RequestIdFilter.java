package com.mycompany.ai_agent.exception;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

@Component
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_ATTRIBUTE = "requestId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = request.getHeader("X-Request-ID");
        if (requestId == null || requestId.isBlank()) {
            requestId = "req_" + UUID.randomUUID().toString().replace("-", "");
        }
        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
        response.setHeader("X-Request-ID", requestId);
        filterChain.doFilter(request, response);
    }
}
