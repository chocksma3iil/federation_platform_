package com.federation.clubs.ai.dto;

import java.util.List;

public class ChatRequest {
    private List<ChatMessageDto> messages;
    public List<ChatMessageDto> getMessages() { return messages; }
    public void setMessages(List<ChatMessageDto> messages) { this.messages = messages; }
}