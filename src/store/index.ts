import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { titlesApi } from "./api/titlesApi";
import { chaptersApi } from "./api/chaptersApi";
import { notificationsApi } from "./api/notificationsApi";
import { mangaParserApi } from "./api/mangaParserApi";
import { statsApi } from "./api/statsApi";
import { usersApi } from "./api/usersApi";
import { collectionsApi } from "./api/collectionsApi";
import { commentsApi } from "./api/commentsApi";
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
    [mangaParserApi.reducerPath]: mangaParserApi.reducer,
    [statsApi.reducerPath]: statsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [collectionsApi.reducerPath]: collectionsApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(titlesApi.middleware)
      .concat(chaptersApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(mangaParserApi.middleware)
      .concat(statsApi.middleware)
      .concat(usersApi.middleware)
      .concat(collectionsApi.middleware)
      .concat(commentsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
