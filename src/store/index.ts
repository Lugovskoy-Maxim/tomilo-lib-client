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
import { reportsApi } from "./api/reportsApi";
import { autoParsingApi } from "./api/autoParsingApi";
import { ipApi } from "./api/ipApi";
import { shopApi } from "./api/shopApi";
import titlesReducer from "./slices/titlesSlice";
import authReducer from "./slices/authSlice";
import collectionsReducer from "./slices/collectionsSlice";
import chaptersReducer from "./slices/chaptersSlice";
import commentsReducer from "./slices/commentsSlice";
import notificationsReducer from "./slices/notificationsSlice";
import userProfileReducer from "./slices/userProfileSlice";
import readingHistoryReducer from "./slices/readingHistorySlice";
import bookmarksReducer from "./slices/bookmarksSlice";
import searchReducer from "./slices/searchSlice";
import filterReducer from "./slices/filterSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    titles: titlesReducer,
    collections: collectionsReducer,
    chapters: chaptersReducer,
    comments: commentsReducer,
    notifications: notificationsReducer,
    userProfile: userProfileReducer,
    readingHistory: readingHistoryReducer,
    bookmarks: bookmarksReducer,
    search: searchReducer,
    filter: filterReducer,
    [authApi.reducerPath]: authApi.reducer,
    [titlesApi.reducerPath]: titlesApi.reducer,
    [chaptersApi.reducerPath]: chaptersApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [mangaParserApi.reducerPath]: mangaParserApi.reducer,
    [statsApi.reducerPath]: statsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [collectionsApi.reducerPath]: collectionsApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [autoParsingApi.reducerPath]: autoParsingApi.reducer,
    [ipApi.reducerPath]: ipApi.reducer,
    [shopApi.reducerPath]: shopApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      titlesApi.middleware,
      chaptersApi.middleware,
      notificationsApi.middleware,
      mangaParserApi.middleware,
      statsApi.middleware,
      usersApi.middleware,
      collectionsApi.middleware,
      commentsApi.middleware,
      reportsApi.middleware,
      autoParsingApi.middleware,
      ipApi.middleware,
      shopApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
