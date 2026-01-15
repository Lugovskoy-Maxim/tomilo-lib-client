import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types/notifications';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  selectedNotification: Notification | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  selectedNotification: null,
  isLoading: false,
  error: null,
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    setSelectedNotification: (state, action: PayloadAction<Notification | null>) => {
      state.selectedNotification = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    updateNotification: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(notification => notification._id === action.payload._id);
      if (index !== -1) {
        state.notifications[index] = action.payload;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(notification => notification._id !== action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(notification => notification._id === action.payload);
      if (index !== -1) {
        state.notifications[index].isRead = true;
      }
    },
    markAllAsRead: (state) => {
      state.notifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true
      }));
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  setSelectedNotification,
  setLoading,
  setError,
  addNotification,
  updateNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;