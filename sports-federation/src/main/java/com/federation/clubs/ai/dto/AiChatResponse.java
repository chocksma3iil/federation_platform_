package com.federation.clubs.ai.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private ChatActionDto action; // nullable
}