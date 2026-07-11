package com.federation.clubs.ai;

import com.federation.athletes.repository.AthleteRepository;
import com.federation.clubs.ai.dto.*;
import com.federation.clubs.entity.Club;
import com.federation.clubs.repository.ClubRepository;
import com.federation.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.federation.clubs.ai.dto.AiChatResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
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

        @Value("${ai.ollama.keep-alive:20m}")
        private String keepAlive;

        @Value("${ai.ollama.max-history-messages:8}")
        private int maxHistoryMessages;

        @Value("${ai.ollama.max-message-chars:700}")
        private int maxMessageChars;

        @Value("${ai.ollama.max-known-clubs:25}")
        private int maxKnownClubs;

        @Value("${ai.ollama.num-predict:180}")
        private int numPredict;

        @Value("${ai.ollama.num-ctx:1024}")
        private int numCtx;

        @Value("${ai.ollama.temperature:0.1}")
        private double temperature;

        @Value("${ai.ollama.connect-timeout-ms:2000}")
        private int connectTimeoutMs;

        @Value("${ai.ollama.response-timeout-ms:45000}")
        private long responseTimeoutMs;

    private WebClient client() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
            .responseTimeout(Duration.ofMillis(responseTimeoutMs));

        return WebClient.builder()
            .baseUrl(ollamaBaseUrl)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }

    public AiChatResponse handleChat(ChatRequest request) {
        List<ChatMessageDto> incoming = Optional.ofNullable(request)
            .map(ChatRequest::getMessages)
            .orElseGet(Collections::emptyList);

        String lastUserMessage = incoming.stream()
            .filter(m -> "user".equalsIgnoreCase(m.role()))
            .reduce((a, b) -> b)
            .map(ChatMessageDto::content)
            .map(this::sanitizeMessage)
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
            Known clubs (for disambiguation): %s
            If the request doesn't require any club action, set "action" to null.
            """.formatted(clubNamesSummary());

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.addAll(recentMessages(incoming));

        if (messages.size() == 1) {
            messages.add(Map.of("role", "user", "content", lastUserMessage));
        }

        Map<String, Object> body = Map.of(
            "model", ollamaModel,
            "messages", messages,
            "stream", false,
            "format", "json",
            "keep_alive", keepAlive,
            "options", Map.of(
                    "num_predict", numPredict,
                    "num_ctx", numCtx,
                    "temperature", temperature
            )
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
        return clubRepository
                .findAll(PageRequest.of(0, maxKnownClubs, Sort.by(Sort.Direction.ASC, "name")))
                .stream()
                .map(Club::getName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("none");
    }

    private List<Map<String, String>> recentMessages(List<ChatMessageDto> allMessages) {
        if (allMessages.isEmpty()) {
            return List.of();
        }

        int start = Math.max(0, allMessages.size() - maxHistoryMessages);
        List<Map<String, String>> trimmed = new ArrayList<>();

        for (int i = start; i < allMessages.size(); i++) {
            ChatMessageDto m = allMessages.get(i);
            String role = m.role() == null ? "user" : m.role().toLowerCase(Locale.ROOT);
            if (!"user".equals(role) && !"assistant".equals(role)) {
                continue;
            }
            trimmed.add(Map.of(
                    "role", role,
                    "content", sanitizeMessage(m.content())
            ));
        }

        return trimmed;
    }

    private String sanitizeMessage(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String normalized = content.replaceAll("\\s+", " ").trim();
        return normalized.length() <= maxMessageChars
                ? normalized
                : normalized.substring(0, maxMessageChars);
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