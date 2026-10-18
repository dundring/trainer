import { Workout } from './workoutTypes';

export enum ApiStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  LOADING = 'LOADING',
}
export interface ApiSuccessResponseBody<T> {
  status: ApiStatus.SUCCESS;
  data: T;
}
export interface ApiErrorResponseBody {
  status: ApiStatus.FAILURE;
  message: string;
}
export interface ApiLoading {
  status: ApiStatus.LOADING;
}

export type ApiResponseBody<T> =
  | ApiSuccessResponseBody<T>
  | ApiErrorResponseBody;

export interface MeResponseBody {
  username: string;
  ftp: number;
}

export interface UserUpdateRequestBody {
  ftp?: number;
  username?: string;
}

export interface UserUpdateResponseBody {
  ftp: number;
  username: string;
}

export interface WorkoutsResponseBody {
  workouts: Workout[];
}
export interface UpdateWorkoutResponseBody {
  workout: Workout;
}

export interface GetWorkoutResponseBody {
  workout: Workout;
}

export interface WorkoutRequestBody {
  workout: Workout;
}

export interface FeedbackRequestBody {
  message: string;
  mail: string | null;
}
