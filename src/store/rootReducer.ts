/**
 * Единая регистрация всех API и слайсов store.
 * При добавлении нового RTK Query API: добавьте его в массив apiList ниже —
 * reducer и middleware подключатся автоматически.
 */
import type { Middleware } from "@reduxjs/toolkit";
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
import { announcementsApi } from "./api/announcementsApi";
import { leaderboardApi } from "./api/leaderboardApi";
import { genresApi } from "./api/genresApi";
import { achievementsApi } from "./api/achievementsApi";
import { siteSettingsApi } from "./api/siteSettingsApi";
import { auditLogsApi } from "./api/auditLogsApi";
import { charactersApi } from "./api/charactersApi";
import { translatorsApi } from "./api/translatorsApi";
import { subscriptionsApi } from "./api/subscriptionsApi";
import { searchApi } from "./api/searchApi";
import { adminApi } from "./api/adminApi";
import { promocodesApi } from "./api/promocodesApi";
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

const apiList = [
  authApi,
  titlesApi,
  chaptersApi,
  notificationsApi,
  mangaParserApi,
  statsApi,
  usersApi,
  collectionsApi,
  commentsApi,
  reportsApi,
  autoParsingApi,
  ipApi,
  shopApi,
  announcementsApi,
  leaderboardApi,
  genresApi,
  achievementsApi,
  siteSettingsApi,
  auditLogsApi,
  charactersApi,
  translatorsApi,
  subscriptionsApi,
  searchApi,
  adminApi,
  promocodesApi,
];

const slices = {
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
} as const;

export const rootReducer = {
  ...slices,
  ...Object.fromEntries(apiList.map(api => [api.reducerPath, api.reducer])),
};

export const apiMiddleware: Middleware[] = apiList.map(api => api.middleware);
