import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { titlesApi } from "./api/titlesApi";
import titlesReducer from "./slices/titlesSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    titles: titlesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [titlesApi.reducerPath]: titlesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(titlesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
