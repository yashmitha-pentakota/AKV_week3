// chat.ts (Chat Model)
export interface ChatMessage {
    sender: string;
    receiver?: string;
    content: string;
    timestamp?: string;
    type: 'private' | 'group';
    room?: string;
  }
  
  export interface User {
    username: string;
    id: string;
  }