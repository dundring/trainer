import * as core from 'express-serve-static-core';
import {
  ApiResponseBody,
  ApiStatus,
  GetWorkoutResponseBody,
  UpdateWorkoutResponseBody,
  WorkoutRequestBody,
  WorkoutsResponseBody,
} from '@dundring/types';
import * as express from 'express';
import { validationService, workoutService } from '../../services';
import { isError } from '@dundring/utils';

const router = express.Router();

router.get<null, ApiResponseBody<WorkoutsResponseBody>>(
  '/',
  async (req, res) => {
    const auth = await validationService.authenticate(req, res);
    if (!auth) return;

    const workouts = await workoutService.getUserWorkouts(auth.userId);

    if (isError(workouts)) {
      res.send({ status: ApiStatus.FAILURE, message: workouts.type });
      return;
    }

    res.send({
      status: ApiStatus.SUCCESS,
      data: { workouts: workouts.data },
    });
  }
);

router.post<WorkoutRequestBody, ApiResponseBody<UpdateWorkoutResponseBody>>(
  '/',
  async (req, res) => {
    const auth = await validationService.authenticate(req, res);
    if (!auth) return;

    const workout = req.body.workout;

    const ret = await workoutService.upsertWorkout(
      auth.userId,
      workout,
      workout.id
    );

    switch (ret.status) {
      case 'SUCCESS':
        res.send({
          status: ApiStatus.SUCCESS,
          data: { workout: ret.data },
        });
        return;
      default:
        res.send({
          status: ApiStatus.FAILURE,
          message: ret.type,
        });
        return;
    }
  }
);

router.delete<{ workoutId: string }, ApiResponseBody<{}>>(
  '/:workoutId',
  async (req, res) => {
    const auth = await validationService.authenticate(req, res);
    if (!auth) return;
    const workoutId = req.params['workoutId'];

    const ret = await workoutService.deleteWorkout(auth.userId, workoutId);

    switch (ret.status) {
      case 'SUCCESS':
        res.send({
          status: ApiStatus.SUCCESS,
          data: {},
        });
        return;
      default:
        res.send({
          status: ApiStatus.FAILURE,
          message: ret.type,
        });
        return;
    }
  }
);

router.get<{ workoutId: string }, ApiResponseBody<GetWorkoutResponseBody>>(
  '/:workoutId',
  async (req, res) => {
    const workoutId = req.params['workoutId'];
    const response = await workoutService.getWorkout(workoutId);

    switch (response.status) {
      case 'SUCCESS':
        res.send({
          status: ApiStatus.SUCCESS,
          data: { workout: response.data },
        });
        return;
      default:
        res.send({
          status: ApiStatus.FAILURE,
          message: response.type,
        });
        return;
    }
  }
);

export default router;
