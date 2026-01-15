import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TitleType, TitleStatus } from '@/types/title';

interface FilterState {
  selectedGenres: string[];
  selectedTypes: TitleType[];
  selectedStatuses: TitleStatus[];
  selectedAgeLimits: number[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  releaseYearRange: [number, number] | null;
}

const initialState: FilterState = {
  selectedGenres: [],
  selectedTypes: [],
  selectedStatuses: [],
  selectedAgeLimits: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',
  releaseYearRange: null,
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setSelectedGenres: (state, action: PayloadAction<string[]>) => {
      state.selectedGenres = action.payload;
    },
    setSelectedTypes: (state, action: PayloadAction<TitleType[]>) => {
      state.selectedTypes = action.payload;
    },
    setSelectedStatuses: (state, action: PayloadAction<TitleStatus[]>) => {
      state.selectedStatuses = action.payload;
    },
    setSelectedAgeLimits: (state, action: PayloadAction<number[]>) => {
      state.selectedAgeLimits = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    setReleaseYearRange: (state, action: PayloadAction<[number, number] | null>) => {
      state.releaseYearRange = action.payload;
    },
    resetFilters: (state) => {
      state.selectedGenres = [];
      state.selectedTypes = [];
      state.selectedStatuses = [];
      state.selectedAgeLimits = [];
      state.releaseYearRange = null;
    },
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setSelectedGenres,
  setSelectedTypes,
  setSelectedStatuses,
  setSelectedAgeLimits,
  setSortBy,
  setSortOrder,
  setReleaseYearRange,
  resetFilters,
  setFilters,
} = filterSlice.actions;

export default filterSlice.reducer;