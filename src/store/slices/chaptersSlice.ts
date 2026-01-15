import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Chapter } from "@/types/title";

interface ChaptersState {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}

const initialState: ChaptersState = {
  chapters: [],
  selectedChapter: null,
  isLoading: false,
  error: null,
  search: "",
};

export const chaptersSlice = createSlice({
  name: "chapters",
  initialState,
  reducers: {
    setChapters: (state, action: PayloadAction<Chapter[]>) => {
      state.chapters = action.payload;
    },
    setSelectedChapter: (state, action: PayloadAction<Chapter | null>) => {
      state.selectedChapter = action.payload;
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
    addChapter: (state, action: PayloadAction<Chapter>) => {
      state.chapters.push(action.payload);
    },
    updateChapter: (state, action: PayloadAction<Chapter>) => {
      const index = state.chapters.findIndex(chapter => chapter._id === action.payload._id);
      if (index !== -1) {
        state.chapters[index] = action.payload;
      }
    },
    removeChapter: (state, action: PayloadAction<string>) => {
      state.chapters = state.chapters.filter(chapter => chapter._id !== action.payload);
    },
  },
});

export const {
  setChapters,
  setSelectedChapter,
  setSearch,
  setLoading,
  setError,
  addChapter,
  updateChapter,
  removeChapter,
} = chaptersSlice.actions;

export default chaptersSlice.reducer;
