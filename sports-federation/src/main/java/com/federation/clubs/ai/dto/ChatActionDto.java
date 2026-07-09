package com.federation.clubs.ai.dto;

import lombok.*;
import java.util.Map;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatActionDto {
    private String action;      // createClub | updateClub | deleteClub | searchClubs
    private Map<String, Object> data;
    private String query;
}
