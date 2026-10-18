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

export interface MailLoginRequestBody {
  mail: string;
}

export type RequestLoginLinkMailResponseBody =
  | 'Login link sent'
  | 'Register link sent';

export interface MailAuthenticationRequestBody {
  code: string;
}

export interface StravaAuthenticationRequestBody {
  code: string;
  scope: string;
}

export interface AuthenticationResponseBody {
  user_created: boolean;
  data: LoginResponseBody;
}

export interface LoginResponseBody {
  username: string;
  userId: string;
  token: string;
  ftp: number;
  stravaData: {
    athleteId: number;
    scopes: Scopes;
  } | null;
}

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

export interface Scopes {
  read: boolean;
  activityWrite: boolean;
}

export interface ProfileResponseBody {
  username: string;
  ftp: number;
  mailAuthentication: MailAuthentication | null;
  stravaAuthentication: StravaAuthenticationResp | null;
}

export interface MailAuthentication {
  mail: string;
}

export interface StravaAuthenticationResp {
  athleteId: number;
  scopes: {
    read: boolean;
    activityWrite: boolean;
  };
}

export interface FeedbackRequestBody {
  message: string;
  mail: string | null;
}
