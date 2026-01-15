import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BookmarkItem } from "@/types/store";

interface BookmarksState {
  bookmarks: BookmarkItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BookmarksState = {
  bookmarks: [],
  isLoading: false,
  error: null,
};

export const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {
    setBookmarks: (state, action: PayloadAction<BookmarkItem[]>) => {
      state.bookmarks = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addBookmark: (state, action: PayloadAction<BookmarkItem>) => {
      state.bookmarks.push(action.payload);
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(bookmark => bookmark._id !== action.payload);
    },
    clearBookmarks: state => {
      state.bookmarks = [];
    },
  },
});

export const { setBookmarks, setLoading, setError, addBookmark, removeBookmark, clearBookmarks } =
  bookmarksSlice.actions;

export default bookmarksSlice.reducer;
