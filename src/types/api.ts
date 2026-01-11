export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiResponseDto<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  path?: string;
}
