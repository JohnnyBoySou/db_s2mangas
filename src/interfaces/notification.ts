export type NotificationType = 
    | 'new_chapter'
    | 'manga_update'
    | 'comment_reply'
    | 'like'
    | 'system';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationResponse {
    notification: Notification;
}

export interface NotificationListResponse {
    notifications: NotificationResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
}

export interface NotificationPreferences {
    newChapter: boolean;
    mangaUpdate: boolean;
    commentReply: boolean;
    like: boolean;
    system: boolean;
} 