export enum CommentEntityType {
  TITLE = 'title',
  CHAPTER = 'chapter',
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

export interface ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  path: string;
  method?: string;
}

