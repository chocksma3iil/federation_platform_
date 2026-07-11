import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ChatMessage, AiChatResponse, Prediction } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = inject(ApiService);
  private readonly maxMessages = 8;
  private readonly maxChars = 700;

  chat(history: ChatMessage[]): Observable<AiChatResponse> {
    const messages = history
      .slice(-this.maxMessages)
      .map(m => ({
        role: m.role,
        content: (m.content ?? '').replace(/\s+/g, ' ').trim().slice(0, this.maxChars),
      }));

    return this.api.post<AiChatResponse>('/ai/clubs/chat', { messages });
  }

  getClubPrediction(clubId: string): Observable<Prediction> {
    return this.api.get<Prediction>(`/ai/clubs/${clubId}/prediction`);
  }
}