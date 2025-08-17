export interface Collaborator {
  id: string;
  userId: string;
  collectionId: string;
  role: 'EDITOR' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

export interface AddCollaboratorRequest {
  userId: string;
  role?: 'EDITOR' | 'ADMIN';
}

export interface UpdateCollaboratorRoleRequest {
  role: 'EDITOR' | 'ADMIN';
}

export interface UserPermission {
  hasPermission: boolean;
  isOwner: boolean;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | null;
}

export interface CollectionWithCollaborators {
  id: string;
  userId: string;
  name: string;
  cover: string;
  description?: string;
  status: 'PRIVATE' | 'PUBLIC';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  collaborators: Collaborator[];
  _count: {
    likes: number;
    mangas: number;
  };
}
