import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { AiService } from '@core/services/ai.service';
import { ChatMessage, ChatAction } from '@core/models';

@Component({
  selector: 'app-club-ai-assistant',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex flex-col h-[560px] w-[420px]">
      <div class="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <div class="flex items-center gap-2">
          <mat-icon class="text-primary-600">auto_awesome</mat-icon>
          <h3 class="font-semibold text-surface-900">Club Assistant</h3>
        </div>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        @if (messages().length === 0) {
          <p class="text-sm text-surface-400">
            Ask me things like “create a club named Étoile Sportive in Sfax”,
            “suspend club Espoir”, or “find clubs in Tunis”.
          </p>
        }
        @for (m of messages(); track $index) {
          <div [class]="m.role === 'user' ? 'ml-auto max-w-[80%] bg-primary-600 text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm' : 'mr-auto max-w-[85%] bg-surface-100 text-surface-800 rounded-2xl rounded-bl-sm px-4 py-2 text-sm whitespace-pre-line'">
            {{ m.content }}
          </div>
        }
        @if (thinking()) {
          <div class="flex items-center gap-2 text-surface-400 text-sm">
            <mat-spinner diameter="16" /> Thinking…
          </div>
        }
      </div>

      <div class="p-3 border-t border-surface-100 flex gap-2">
        <mat-form-field appearance="outline" class="flex-1 !mb-[-1.25em]">
          <input matInput [(ngModel)]="draft" (keydown.enter)="send()" placeholder="Type a request…" [disabled]="thinking()" />
        </mat-form-field>
        <button mat-icon-button color="primary" (click)="send()" [disabled]="thinking() || !draft.trim()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
})
export class ClubAiAssistantComponent {
  private ai = inject(AiService);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<ClubAiAssistantComponent>, { optional: true });

  messages = signal<ChatMessage[]>([]);
  thinking = signal(false);
  draft = '';

  close(): void { this.dialogRef?.close(); }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.draft = '';

    const next = [...this.messages(), { role: 'user' as const, content: text }];
    this.messages.set(next);
    this.thinking.set(true);

    this.ai.chat(next).subscribe({
      next: res => {
        this.messages.set([...this.messages(), { role: 'assistant', content: res.reply }]);
        this.thinking.set(false);
        if (res.action) this.executeAction(res.action);
      },
      error: () => {
        this.messages.set([...this.messages(), { role: 'assistant', content: 'Sorry, I could not process that request.' }]);
        this.thinking.set(false);
      },
    });
  }

  private executeAction(action: ChatAction): void {
    switch (action.action) {
      case 'createClub':
        this.api.post('/clubs', action.data).subscribe({
          next: () => this.notify.success('Club created via AI assistant.'),
          error: (e) => this.notify.error(e?.error?.message ?? 'Could not create the club.'),
        });
        break;
      case 'updateClub':
        this.api.put(`/clubs/${action.data.id}`, action.data).subscribe({
          next: () => this.notify.success('Club updated via AI assistant.'),
          error: (e) => this.notify.error(e?.error?.message ?? 'Could not update the club.'),
        });
        break;
      case 'deleteClub':
        this.api.delete(`/clubs/${action.data.id}`).subscribe({
          next: () => this.notify.success('Club deleted via AI assistant.'),
          error: (e) => this.notify.error(e?.error?.message ?? 'Could not delete the club.'),
        });
        break;
      case 'searchClubs':
        // Parent (clubs-list) can subscribe to this via dialogRef.afterClosed() result
        // or you can inject a shared signal/service to push the query in.
        break;
    }
  }
}