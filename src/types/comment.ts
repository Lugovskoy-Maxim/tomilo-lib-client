export enum CommentEntityType {
  TITLE = "title",
  CHAPTER = "chapter",
}

/** Минимальные данные автора комментария; при populate('userId') приходят username, avatar, role, equippedDecorations. */
export interface CommentUser {
  _id: string;
  username: string;
  avatar?: string;
  /** Роль пользователя (admin, moderator, user) — для отображения галочки админа */
  role?: string;
  /** Надетые декорации (бэкенд может вернуть URL картинки рамки/аватара для отображения в комментариях) */
  equippedDecorations?: { frame?: string | null; avatar?: string | null };
  /** Вариант от API (snake_case) */
  equipped_decorations?: { frame?: string | null; avatar?: string | null };
}

/** Одна реакция в ответе API: эмодзи и количество поставивших */
export interface CommentReactionCount {
  emoji: string;
  count: number;
}

/** Разрешённые эмодзи для реакций (как в Telegram) */
export const ALLOWED_REACTION_EMOJIS = ["👍", "👎", "❤️", "🔥", "😂", "😮", "😢", "🎉", "👏"] as const;

export type AllowedReactionEmoji = (typeof ALLOWED_REACTION_EMOJIS)[number];

export interface Comment {
  _id: string;
  userId: CommentUser | string;
  entityType: CommentEntityType;
  entityId: string;
  content: string;
  parentId: string | null;
  /** Реакции: эмодзи и количество. Старые лайки/дизлайки отображаются как 👍 и 👎 */
  reactions?: CommentReactionCount[];
  /**
   * @deprecated Используйте reactions (эмодзи 👍). Оставлено для совместимости.
   */
  likes: number;
  /**
   * @deprecated Используйте reactions (эмодзи 👎). Оставлено для совместимости.
   */
  dislikes: number;
  /**
   * @deprecated Используйте reactions. Оставлено для совместимости.
   */
  likedBy: string[];
  /**
   * @deprecated Используйте reactions. Оставлено для совместимости.
   */
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
  content?: string;
  isVisible?: boolean;
}

/** Тело запроса POST /comments/:id/reactions */
export interface SetCommentReactionDto {
  emoji: string;
}

/** Ответ GET /comments/:id/reactions/count */
export interface CommentReactionsCountResponse {
  reactions: CommentReactionCount[];
}
