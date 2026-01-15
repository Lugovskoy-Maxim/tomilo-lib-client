import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Collection } from "@/types/collection";

interface CollectionsState {
  collections: Collection[];
  selectedCollection: Collection | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}

const initialState: CollectionsState = {
  collections: [],
  selectedCollection: null,
  isLoading: false,
  error: null,
  search: "",
};

export const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      state.collections = action.payload;
    },
    setSelectedCollection: (state, action: PayloadAction<Collection | null>) => {
      state.selectedCollection = action.payload;
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
    addCollection: (state, action: PayloadAction<Collection>) => {
      state.collections.push(action.payload);
    },
    updateCollection: (state, action: PayloadAction<Collection>) => {
      const index = state.collections.findIndex(collection => collection.id === action.payload.id);
      if (index !== -1) {
        state.collections[index] = action.payload;
      }
    },
    removeCollection: (state, action: PayloadAction<string>) => {
      state.collections = state.collections.filter(collection => collection.id !== action.payload);
    },
  },
});

export const {
  setCollections,
  setSelectedCollection,
  setSearch,
  setLoading,
  setError,
  addCollection,
  updateCollection,
  removeCollection,
} = collectionsSlice.actions;

export default collectionsSlice.reducer;
