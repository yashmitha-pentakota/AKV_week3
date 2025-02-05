import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ChatService } from '../../core/services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  messages: any[] = [];
  username: string = '';
  message: string = '';
  typing: boolean = false;
  typingUser: string = '';
  onlineUsers: string[] = [];
  showNameInput: boolean = true;

  constructor(private chatService: ChatService, private router: Router) {}

  ngOnInit(): void {
    // Fetch messages and online users from the backend
    this.chatService.getMessages().subscribe(messages => {
      this.messages = messages;
    });

    this.chatService.getOnlineUsers().subscribe(users => {
      this.onlineUsers = users;
    });

    this.chatService.getTypingStatus().subscribe((typingMessage: string) => {
      if (typingMessage) {
        this.typingUser = typingMessage;
        this.typing = true;
      } else {
        this.typingUser = '';
        this.typing = false;
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  joinChat() {
    this.showNameInput = false;
    this.chatService.joinRoom(this.username);
  }

  leaveChat() {
    this.showNameInput = true;
    this.chatService.leaveRoom();
  }

  sendMessage() {
    if (this.message.trim()) {
      this.chatService.sendMessage(this.message, this.username);
      this.message = ''; // Clear the input after sending
      this.chatService.emitStopTyping(); // Notify the server that typing has stopped
    }
  }

  onTyping() {
    if (this.message.trim()) {
      this.chatService.emitTypingStatus(this.username); // Notify the server when user starts typing
    }
  }

  clearMessage() {
    this.message = '';
    this.chatService.emitStopTyping(); // Notify the server that typing has stopped
  }

  scrollToBottom() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  onFocusInput() {
    const inputElement = document.querySelector('.username-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.style.borderColor = '#4CAF50'; // Change border color on focus
    }
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
