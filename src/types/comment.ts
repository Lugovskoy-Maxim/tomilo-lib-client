export enum CommentEntityType {
  TITLE = "title",
  CHAPTER = "chapter",
}

export interface CommentUser {
  _id: string;
  username: string;
  avatar?: string;
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
