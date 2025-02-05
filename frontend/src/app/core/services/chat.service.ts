import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

// Define message structure
interface Message {
  content: string;
  sender: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);
  private messageSubject = new BehaviorSubject<Message[]>([]);
  typingSubject = new BehaviorSubject<string>('');

  constructor() {
    this.socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      withCredentials: true  // Add credentials if necessary (for cross-origin issues)
    });
    

    // Listen for new messages
    this.socket.on('message', (message: Message) => {
      this.messageSubject.next([...this.messageSubject.getValue(), message]);
    });

    // Listen for online users updates
    this.socket.on('onlineUsers', (users: string[]) => {
      this.onlineUsersSubject.next(users);
    });

    // Listen for typing status
    this.socket.on('userTyping', (username: string) => {
      this.typingSubject.next(`${username} is typing...`);
    });

    // Listen for stop typing status
    this.socket.on('userStopTyping', () => {
      this.typingSubject.next('');
    });
  }

  // Send message to the backend
  sendMessage(message: string, username: string): void {
    console.log(message);
    this.socket.emit('sendMessage', { content: message, sender: username });
  }

  // Emit typing status to the backend
  emitTypingStatus(username: string): void {
    this.socket.emit('typing', username);
  }

  // Emit stop typing status
  emitStopTyping(): void {
    this.socket.emit('stopTyping');
  }

  // Fetch the messages
  getMessages() {
    return this.messageSubject.asObservable();
  }

  // Fetch the online users
  getOnlineUsers() {
    return this.onlineUsersSubject.asObservable();
  }

  // Get typing status
  getTypingStatus() {
    return this.typingSubject.asObservable();
  }

  // Join the room
  joinRoom(username: string): void {
    this.socket.emit('joinRoom', username);
  }

  // Leave the room
  leaveRoom(): void {
    this.socket.emit('leaveRoom');
  }
}
