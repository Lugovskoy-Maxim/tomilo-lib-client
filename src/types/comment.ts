export enum CommentEntityType {
  TITLE = "title",
  CHAPTER = "chapter",
}

/** Минимальные данные автора комментария; при populate может быть equippedDecorations (URL или ID рамки/аватара). */
export interface CommentUser {
  _id: string;
  username: string;
  avatar?: string;
  /** Надетые декорации (бэкенд может вернуть URL картинки рамки/аватара для отображения в комментариях) */
  equippedDecorations?: { frame?: string | null; avatar?: string | null };
}

export interface Comment {
  _id: string;
  userId: CommentUser | string;
  entityType: CommentEntityType;
  entityId: string;
  content: string;
  parentId: string | null;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  isVisible: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  // Информация о тайтле для отображения в админке
  titleInfo?: {
    _id: string;
    name: string;
    slug?: string;
  };
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface CreateCommentDto {
  entityType: CommentEntityType;
  entityId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}
