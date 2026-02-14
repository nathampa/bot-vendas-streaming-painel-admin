import axios from 'axios';

type ErrorResponseShape = {
  detail?: string;
  message?: string;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<ErrorResponseShape>(error)) {
    return error.response?.data?.detail ?? error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

