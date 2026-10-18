import { Status, StravaUpload } from '@dundring/types';
import { error, isSuccess, success } from '@dundring/utils';
import fetch from 'node-fetch';
import * as FormData from 'form-data';
import { monitoringService } from './index';

export const uploadFileToStrava = async (
  fileContent: string,
  activityName: string,
  accessToken: string
): Promise<Status<StravaUpload, string>> => {
  const formData = new FormData.default();
  formData.append('file', fileContent, {
    filename: 'dundring.tcx',
    contentType: 'application/xml',
  });
  formData.append('data_type', 'tcx');

  formData.append('name', activityName);

  try {
    const response = await fetch('https://www.strava.com/api/v3/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as StravaUpload;

    const fetchStravaUpload = async () => {
      const uploadResponse = await fetch(
        `https://www.strava.com/api/v3/uploads/${data.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Error: ${uploadResponse.statusText}`);
      }

      const uploadData = (await uploadResponse.json()) as StravaUpload;

      if (uploadData.activity_id) {
        console.log('API called successfully. Returned data:', uploadData);
        return success(uploadData);
      }

      if (uploadData.error) {
        console.error('Upload failed:', uploadData.error);
        return error('Something went wrong while uploading');
      }

      return null;
    };

    const pollCheckUpload = async () => {
      while (true) {
        await pause(2000);
        try {
          const stravaUploadResponse = await fetchStravaUpload();

          if (stravaUploadResponse) {
            if (isSuccess(stravaUploadResponse)) {
              monitoringService.logActivityUpload(
                stravaUploadResponse.data.activity_id
              );
            }
            return stravaUploadResponse;
          }
        } catch (err) {
          console.error('An error occurred:', err);
          return error('Something went wrong while uploading');
        }
      }
    };

    return pollCheckUpload();
  } catch (err) {
    console.error('Upload failed:', err);
    return error('Something went wrong while uploading');
  }
};

const pause = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));
