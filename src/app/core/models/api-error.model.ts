export interface ApiFieldError {
  field: string;
  error: string;
}

export interface ApiError {
  message?: string;
  fieldErrors?: ApiFieldError[];
}