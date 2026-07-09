package com.federation.clubs.ai;

import com.federation.clubs.ai.dto.*;
import com.federation.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.federation.clubs.ai.dto.AiChatResponse;
import java.util.UUID;

@RestController
@RequestMapping("/ai/clubs")
@RequiredArgsConstructor
public class ClubAiController {

    private final ClubAiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(aiService.handleChat(request)));
    }

    @GetMapping("/{id:[0-9a-fA-F-]{36}}/prediction")
    public ResponseEntity<ApiResponse<PredictionDto>> prediction(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(aiService.predictGrowth(id)));
    }
}