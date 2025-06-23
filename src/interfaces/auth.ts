export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    cover?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface RegisterBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
    cover?: string;
    categories?: Array<{ name: string }>;
    languages?: string[];
}

export interface LoginBody {
    email: string;
    password: string;
}

export interface UpdateUserBody {
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
    cover?: string;
    categories?: Array<{ name: string }>;
    languages?: string[];
} 