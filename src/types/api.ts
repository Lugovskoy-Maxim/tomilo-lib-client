export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  path?: string;
}

export interface ApiResponseDto<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  path?: string;
}