import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ChatMessage, AiChatResponse, Prediction } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = inject(ApiService);

  chat(history: ChatMessage[]): Observable<AiChatResponse> {
    return this.api.post<AiChatResponse>('/ai/clubs/chat', { messages: history });
  }

  getClubPrediction(clubId: string): Observable<Prediction> {
    return this.api.get<Prediction>(`/ai/clubs/${clubId}/prediction`);
  }
}