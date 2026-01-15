import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Comment } from "@/types/comment";

interface CommentsState {
  comments: Comment[];
  selectedComment: Comment | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}

const initialState: CommentsState = {
  comments: [],
  selectedComment: null,
  isLoading: false,
  error: null,
  search: "",
};

export const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload;
    },
    setSelectedComment: (state, action: PayloadAction<Comment | null>) => {
      state.selectedComment = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
    },
    updateComment: (state, action: PayloadAction<Comment>) => {
      const index = state.comments.findIndex(comment => comment._id === action.payload._id);
      if (index !== -1) {
        state.comments[index] = action.payload;
      }
    },
    removeComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(comment => comment._id !== action.payload);
    },
  },
});

export const {
  setComments,
  setSelectedComment,
  setSearch,
  setLoading,
  setError,
  addComment,
  updateComment,
  removeComment,
} = commentsSlice.actions;

export default commentsSlice.reducer;
