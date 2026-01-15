import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Title, TitlesState } from "@/types/title";

const initialState: TitlesState = {
  titles: [],
  search: "",
  selectedGenre: null,
  selectedStatus: null,
  selectedTitle: null,
  isLoading: false,
  error: null,
};

export const titlesSlice = createSlice({
  name: "titles",
  initialState,
  reducers: {
    setTitles: (state, action: PayloadAction<Title[]>) => {
      state.titles = action.payload;
    },
    addTitle: (state, action: PayloadAction<Title>) => {
      state.titles.push(action.payload);
    },
    updateTitle: (state, action: PayloadAction<Title>) => {
      const index = state.titles.findIndex((t: { _id: string }) => t._id === action.payload._id);
      if (index !== -1) {
        state.titles[index] = action.payload;
      }
    },
    deleteTitle: (state, action: PayloadAction<string>) => {
      state.titles = state.titles.filter((t: { _id: string }) => t._id !== action.payload);
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setSelectedGenre: (state, action: PayloadAction<string | null>) => {
      state.selectedGenre = action.payload;
    },
    setSelectedStatus: (state, action: PayloadAction<string | null>) => {
      state.selectedStatus = action.payload;
    },
    setSelectedTitle: (state, action: PayloadAction<Title | null>) => {
      state.selectedTitle = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTitles,
  addTitle,
  updateTitle,
  deleteTitle,
  setSearch,
  setSelectedGenre,
  setSelectedStatus,
  setSelectedTitle,
  setLoading,
  setError,
} = titlesSlice.actions;

export default titlesSlice.reducer;
