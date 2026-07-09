package com.federation.clubs.ai;

import com.federation.athletes.repository.AthleteRepository;
import com.federation.clubs.ai.dto.*;
import com.federation.clubs.entity.Club;
import com.federation.clubs.repository.ClubRepository;
import com.federation.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.federation.clubs.ai.dto.AiChatResponse;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubAiService {

    private final ClubRepository clubRepository;
    private final AthleteRepository athleteRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.ollama.base-url}")
    private String ollamaBaseUrl;

    @Value("${ai.ollama.model}")
    private String ollamaModel;

    private WebClient client() {
        return WebClient.builder().baseUrl(ollamaBaseUrl).build();
    }

    public AiChatResponse handleChat(ChatRequest request) {
        String lastUserMessage = request.getMessages().stream()
                .filter(m -> "user".equals(m.role()))
                .reduce((a, b) -> b)
                .map(ChatMessageDto::content)
                .orElse("");

        String systemPrompt = """
            You are a club-management assistant for a sports federation platform.
            Respond ONLY with strict JSON, no markdown, no prose, matching this shape:
            {
              "reply": "<short natural language reply to show the user>",
              "action": {
                "action": "createClub" | "updateClub" | "deleteClub" | "searchClubs" | null,
                "data": { ... fields relevant to the action, or null },
                "query": "<free text search query, or null>"
              }
            }
            Known clubs: %s
            If the request doesn't require any club action, set "action" to null.
            """.formatted(clubNamesSummary());

        Map<String, Object> body = Map.of(
            "model", ollamaModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", lastUserMessage)
            ),
            "stream", false,
            "format", "json"
        );

        try {
            Map<?, ?> response = client().post()
                    .uri("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            String content = (String) ((Map<?, ?>) response.get("message")).get("content");
            String clean = content.replaceAll("```json|```", "").trim();
            return objectMapper.readValue(clean, AiChatResponse.class);

        } catch (Exception e) {
            log.error("Ollama call failed", e);
            return AiChatResponse.builder()
                    .reply("The AI assistant is unavailable right now — is Ollama running?")
                    .action(null)
                    .build();
        }
    }

    private String clubNamesSummary() {
        return clubRepository.findAll().stream()
                .map(Club::getName)
                .limit(50)
                .reduce((a, b) -> a + ", " + b)
                .orElse("none");
    }

    // predictGrowth(...) stays exactly as before — it's pure data math, no model needed.
    public PredictionDto predictGrowth(java.util.UUID clubId) {
        // ... unchanged from previous version
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));
        long current = athleteRepository.countByClubId(clubId);
        int y1 = Math.max(0, (int) current - 2);
        int y2 = Math.max(0, (int) current - 5);
        int y3 = Math.max(0, (int) current - 8);
        int forecast = (int) current + Math.max(1, (int) (current * 0.15));
        String trend = current > y1 ? "GROWING" : current < y1 ? "DECLINING" : "STABLE";
        String confidence = current > 10 ? "HIGH" : current > 3 ? "MEDIUM" : "LOW";
        List<String> risks = new ArrayList<>();
        List<String> recs = new ArrayList<>();
        if (current < 5) {
            risks.add("Low active roster size makes trend estimates unreliable.");
            recs.add("Recruit at least 5 more active athletes to stabilize forecasting.");
        }
        if (club.getManager() == null) {
            risks.add("No manager assigned to this club.");
            recs.add("Assign a club manager to improve engagement tracking.");
        }
        return PredictionDto.builder()
                .forecast(forecast).confidence(confidence).trend(trend)
                .forecastRangeLow(Math.max(0, forecast - 3)).forecastRangeHigh(forecast + 3)
                .historicalEstimates(List.of(y3, y2, y1))
                .riskFactors(risks).recommendations(recs)
                .summary("Based on " + current + " active athletes, this club is trending " + trend.toLowerCase() + ".")
                .build();
    }
}