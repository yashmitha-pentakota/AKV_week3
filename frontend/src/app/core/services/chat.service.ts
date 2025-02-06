import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

interface Message {
  content: string;
  sender: string;
  type: 'join' | 'leave' | 'message';
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);
  private typingSubject = new BehaviorSubject<string>('');
  private currentUser: string = '';

  constructor() {
    this.socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    // Listen for messages
    this.socket.on('message', (message: Message) => {
      this.messagesSubject.next([...this.messagesSubject.getValue(), message]);
    });

    // Listen for private messages
    this.socket.on('privateMessage', (message: Message) => {
      this.messagesSubject.next([...this.messagesSubject.getValue(), message]);
    });

    // Listen for typing status
    this.socket.on('userTyping', (username: string) => {
      this.typingSubject.next(`${username} is typing...`);
    });

    this.socket.on('userStopTyping', () => {
      this.typingSubject.next('');
    });

    // Listen for online users
    this.socket.on('onlineUsers', (users: string[]) => {
      this.onlineUsersSubject.next(users);
    });
  }

  setUsername(username: string) {
    this.currentUser = username;
  }

  // Send group message
  sendGroupMessage(message: string, username: string): void {
    this.socket.emit('sendMessage', { content: message, sender: username });
  }

  // Send private message
  sendPrivateMessage(message: string, sender: string, receiver: string): void {
    this.socket.emit('privateMessage', { sender, receiver, content: message });
  }
  

  // Fetch messages
  getMessages() {
    return this.messagesSubject.asObservable();
  }

  // Fetch online users
  getOnlineUsers() {
    return this.onlineUsersSubject.asObservable();
  }

  // Get typing status
  getTypingStatus() {
    return this.typingSubject.asObservable();
  }

  // Emit typing status
  emitTyping(username: string): void {
    this.socket.emit('typing', username);
  }
  
  // Emit stop typing status
  emitStopTyping(): void {
    this.socket.emit('stopTyping');
  }

  // Join chat room
  joinRoom(username: string): void {
    this.socket.emit('joinRoom', username);
  }
  
  // Leave chat room
  leaveRoom(): void {
    this.socket.emit('leaveRoom', { username: this.currentUser, type: 'leave' });
  }
}