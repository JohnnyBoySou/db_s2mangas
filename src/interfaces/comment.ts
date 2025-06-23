export interface Comment {
    id: string;
    content: string;
    mangaId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CommentResponse {
    comment: Comment;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
}

export interface CommentListResponse {
    comments: CommentResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
} 