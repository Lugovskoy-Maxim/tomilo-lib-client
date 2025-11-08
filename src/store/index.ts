import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { titlesApi } from "./api/titlesApi";
import { chaptersApi } from "./api/chaptersApi";
import { notificationsApi } from "./api/notificationsApi";
import titlesReducer from "./slices/titlesSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    titles: titlesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [titlesApi.reducerPath]: titlesApi.reducer,
    [chaptersApi.reducerPath]: chaptersApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(titlesApi.middleware)
      .concat(chaptersApi.middleware)
      .concat(notificationsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
