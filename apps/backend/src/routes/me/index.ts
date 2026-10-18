import {
  ApiResponseBody,
  ApiStatus,
  MeResponseBody,
  StravaUpload,
  UserUpdateRequestBody,
  UserUpdateResponseBody,
} from '@dundring/types';
import { isError } from '@dundring/utils';
import * as express from 'express';
import {
  identityService,
  userService,
  validationService,
  stravaService,
} from '../../services';
import multer from 'multer';

const router = express.Router();

router.use('/me', router);

// Signing in at identity doesn't create a trainer user; the first GET /me does,
// with a placeholder username the frontend asks the user to replace.
router.get<null, ApiResponseBody<MeResponseBody>>('/', async (req, res) => {
  const auth = await validationService.authenticate(req, res);
  if (!auth) return;

  const user = await userService.getOrCreateUser(auth.userId);
  if (isError(user)) {
    return res.status(500).send({
      status: ApiStatus.FAILURE,
      message: user.type,
    });
  }

  res.send({
    status: ApiStatus.SUCCESS,
    data: {
      username: user.data.username,
      ftp: user.data.fitnessData?.ftp || 200,
    },
  });
});

router.post<UserUpdateRequestBody, ApiResponseBody<UserUpdateResponseBody>>(
  '/',
  async (req, res) => {
    const auth = await validationService.authenticate(req, res);
    if (!auth) return;

    const ret = await userService.updateUser(auth.userId, {
      username: req.body.username,
      ftp: req.body.ftp,
    });

    if (isError(ret)) {
      return res.send({
        status: ApiStatus.FAILURE,
        message: ret.type,
      });
    }

    const { username, fitnessData } = ret.data;

    res.send({
      status: ApiStatus.SUCCESS,
      data: {
        username,
        ftp: fitnessData?.ftp || req.body.ftp,
      },
    });
  }
);

const fileUpload = multer().single('file');

router.post<any, ApiResponseBody<StravaUpload>>(
  '/upload',
  fileUpload,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send({
        status: ApiStatus.FAILURE,
        message: 'No file provided',
      });
    }
    const fileContent = req.file.buffer.toString();
    const activityName = (req.query.name || 'dundring') as string;

    const auth = await validationService.authenticate(req, res);
    if (!auth) return;

    const accessToken = await identityService.getStravaAccessToken(auth.userId);
    if (isError(accessToken)) {
      // The frontend offers to (re)connect Strava for these.
      const status =
        accessToken.type === 'Could not get Strava token' ? 502 : 409;
      return res.status(status).send({
        status: ApiStatus.FAILURE,
        message: accessToken.type,
      });
    }

    const uploadResponse = await stravaService.uploadFileToStrava(
      fileContent,
      activityName,
      accessToken.data
    );
    if (isError(uploadResponse)) {
      return res.status(500).send({
        status: ApiStatus.FAILURE,
        message: uploadResponse.status,
      });
    }
    res.send({
      status: ApiStatus.SUCCESS,
      data: uploadResponse.data,
    });
  }
);

export default router;
