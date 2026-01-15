import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReadingHistoryEntry } from '@/types/store';

interface ReadingHistoryState {
  history: ReadingHistoryEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReadingHistoryState = {
  history: [],
  isLoading: false,
  error: null,
};

export const readingHistorySlice = createSlice({
  name: 'readingHistory',
  initialState,
  reducers: {
    setHistory: (state, action: PayloadAction<ReadingHistoryEntry[]>) => {
      state.history = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addHistoryEntry: (state, action: PayloadAction<ReadingHistoryEntry>) => {
      state.history.push(action.payload);
    },
    removeHistoryEntry: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(entry => 
        typeof entry.titleId === 'string' ? entry.titleId !== action.payload : entry.titleId._id !== action.payload
      );
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
});

export const {
  setHistory,
  setLoading,
  setError,
  addHistoryEntry,
  removeHistoryEntry,
  clearHistory,
} = readingHistorySlice.actions;

export default readingHistorySlice.reducer;