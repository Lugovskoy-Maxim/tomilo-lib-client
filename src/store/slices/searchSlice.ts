import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Title } from "@/types/title";

interface SearchState {
  query: string;
  results: Title[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalPages: number;
  totalResults: number;
}

const initialState: SearchState = {
  query: "",
  results: [],
  isLoading: false,
  error: null,
  hasMore: false,
  page: 1,
  totalPages: 0,
  totalResults: 0,
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setResults: (
      state,
      action: PayloadAction<{
        data: Title[];
        total: number;
        page: number;
        totalPages: number;
      }>,
    ) => {
      state.results = action.payload.data;
      state.totalResults = action.payload.total;
      state.page = action.payload.page;
      state.totalPages = action.payload.totalPages;
      state.hasMore = action.payload.page < action.payload.totalPages;
    },
    appendResults: (
      state,
      action: PayloadAction<{
        data: Title[];
        total: number;
        page: number;
        totalPages: number;
      }>,
    ) => {
      state.results = [...state.results, ...action.payload.data];
      state.totalResults = action.payload.total;
      state.page = action.payload.page;
      state.totalPages = action.payload.totalPages;
      state.hasMore = action.payload.page < action.payload.totalPages;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearResults: state => {
      state.results = [];
      state.page = 1;
      state.totalPages = 0;
      state.totalResults = 0;
      state.hasMore = false;
    },
  },
});

export const { setQuery, setResults, appendResults, setLoading, setError, clearResults } =
  searchSlice.actions;

export default searchSlice.reducer;
