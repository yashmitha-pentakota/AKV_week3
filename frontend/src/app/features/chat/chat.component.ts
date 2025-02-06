import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../core/services/chat.service';
import {Router} from '@angular/router';
interface Message {
  content: string;
  sender: string;
  system?: boolean; // Flag for system messages like "User joined"
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  onlineUsers: string[] = [];
  typingStatus = '';
  message = '';
  username = '';
  selectedUser = '';
  chatType: 'group' | 'private' | '' = ''; // Controls UI visibility

  constructor(private chatService: ChatService, private router:  Router) {}

  ngOnInit(): void {
    this.chatService.getMessages().subscribe(messages => {
      this.messages = messages;
    });

    this.chatService.getOnlineUsers().subscribe(users => {
      this.onlineUsers = users;
    });

    this.chatService.getTypingStatus().subscribe(status => {
      this.typingStatus = status;
    });
  }

  // User joins chat (either Group or Private)
  joinChat(chatType: 'group' | 'private'): void {
    if (this.username.trim()) {
      this.chatType = chatType;
      this.chatService.joinRoom(this.username);
      
    }
  }

  leaveChat(): void {
    this.chatService.leaveRoom();
    this.messages.push({ content: `${this.username} left the chat`, sender: 'System', system: true });
    this.chatType = ''; // Reset UI to login screen
    this.selectedUser = ''; // Reset selected user
  }
  

  sendMessage(): void {
    if (this.message.trim()) {
      if (this.chatType === 'group') {
        this.chatService.sendGroupMessage(this.message, this.username);
      } else if (this.chatType === 'private' && this.selectedUser) {
        this.chatService.sendPrivateMessage(this.message, this.username, this.selectedUser);
      }
      this.message = '';
    }
  }
  onTyping(): void {
    if (this.username && this.username.trim()) {
      this.chatService.emitTyping(this.username);
    }
  }
  

  stopTyping(): void {
    this.chatService.emitStopTyping();
  }
  goBack() {
    this.router.navigate(['/dashboard']); // Adjust based on your dashboard route
  }
}