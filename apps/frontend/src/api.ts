import {
  ApiResponseBody,
  FeedbackRequestBody,
  GetWorkoutResponseBody,
  MeResponseBody,
  StravaUpload,
  UserUpdateRequestBody,
  UserUpdateResponseBody,
  WorkoutRequestBody,
  WorkoutsResponseBody,
} from '@dundring/types';
import { getAccessToken } from './auth';
import { getEnv } from './utils/environment';

export const domain = location.origin;

export const httpUrl = getEnv().dundringHttpServerUrl;
export const wsUrl = getEnv().dundringWsServerUrl;

const get = async <T>(
  url: string,
  abortController?: AbortController
): Promise<T> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    signal: abortController?.signal,
  });

  return response.json();
};

const post = async <T, U>(
  url: string,
  body: U,
  abortController?: AbortController
): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal: abortController?.signal,
  });

  return response.json();
};

// Without a session the header is left out, and the backend answers 401.
const authorization = async (): Promise<Record<string, string>> => {
  const token = await getAccessToken();
  return token ? { authorization: `Bearer ${token}` } : {};
};

const authGet = async <T>(
  url: string,
  abortController?: AbortController
): Promise<T> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(await authorization()),
    },
    signal: abortController?.signal,
  });

  return response.json();
};

const authDelete = async <T, U>(
  url: string,
  abortController?: AbortController
): Promise<T> => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(await authorization()),
    },
    signal: abortController?.signal,
  });

  return response.json();
};

const authPost = async <T, U>(
  url: string,
  body: U,
  abortController?: AbortController
): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(await authorization()),
    },
    body: JSON.stringify(body),
    signal: abortController?.signal,
  });

  return response.json();
};

export const getMe = async () =>
  authGet<ApiResponseBody<MeResponseBody>>(`${httpUrl}/me`);

export interface Userinfo {
  email: string | null;
  strava: { athlete_id: string; scopes: string[] } | null;
}

/** The signed-in user at identity: email and Strava connection. */
export const getUserinfo = async (): Promise<Userinfo | null> => {
  const response = await fetch(`${getEnv().identityUrl}/userinfo`, {
    headers: await authorization(),
  });
  return response.ok ? response.json() : null;
};

export const fetchMyWorkouts = async () => {
  return authGet<ApiResponseBody<WorkoutsResponseBody>>(`${httpUrl}/workouts`);
};

export const getWorkout = async (workoutId: string) => {
  return get<ApiResponseBody<GetWorkoutResponseBody>>(
    `${httpUrl}/workouts/${workoutId}`
  );
};

export const deleteWorkout = async (workoutId: string) => {
  return authDelete<ApiResponseBody<string>, any>(
    `${httpUrl}/workouts/${workoutId}`
  );
};

export const saveWorkout = async (workout: WorkoutRequestBody) => {
  return authPost<ApiResponseBody<WorkoutsResponseBody>, WorkoutRequestBody>(
    `${httpUrl}/workouts`,
    workout
  );
};

export const updateUser = async (data: { ftp: number; username: string }) => {
  return authPost<
    ApiResponseBody<UserUpdateResponseBody>,
    UserUpdateRequestBody
  >(`${httpUrl}/me`, data);
};

export const uploadActivity = async (file: string, name: string | null) => {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([file], { type: 'application/xml' }),
    'dundring.tcx'
  );

  const url = new URL(`${httpUrl}/me/upload`);
  if (name) {
    url.searchParams.append('name', name);
  }

  return authPostFormData<ApiResponseBody<StravaUpload>>(url, formData);
};

const authPostFormData = async <T>(
  url: URL,
  body: FormData,
  abortController?: AbortController
): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(await authorization()),
    },
    body,
    signal: abortController?.signal,
  });

  return response.json();
};

export const sendFeedback = async (data: FeedbackRequestBody) =>
  post<ApiResponseBody<{}>, FeedbackRequestBody>(`${httpUrl}/feedback`, data);
