import { Button, Icon, Tooltip, useToast } from '@chakra-ui/react';
import { BoxArrowUpRight, Upload } from 'react-bootstrap-icons';
import { toTcxString } from '../../createTcxFile';
import { useData } from '../../context/DataContext';
import * as api from '../../api';
import { useUser } from '../../context/UserContext';
import { ApiStatus } from '@dundring/types';
import { useState } from 'react';
import { useActiveWorkout } from '../../context/ActiveWorkoutContext';

export const UploadToStravaButton = () => {
  const { trackedData } = useData();
  const { user } = useUser();
  const { activeWorkout } = useActiveWorkout();

  const [state, setState] = useState<UploadState>({ type: 'NotAsked' });

  const toast = useToast();

  if (!user.loggedIn || !user.stravaData?.scopes.activityWrite) {
    return (
      <Tooltip label="You need to be logged in and have granted permission to post activities to Strava">
        <Button isDisabled leftIcon={<Icon as={Upload} />}>
          Upload to Strava
        </Button>
      </Tooltip>
    );
  }

  if (state.type === 'Loading') {
    return <Button as="a" variant="link" isLoading={true}></Button>;
  }
  if (state.type === 'Success') {
    return (
      <Button
        as="a"
        href={`https://www.strava.com/activities/${state.activityId}`}
        variant="link"
        rightIcon={<Icon as={BoxArrowUpRight} />}
        target="_blank"
      >
        View Strava activity
      </Button>
    );
  }
  return (
    <Button
      width="100%"
      onClick={async () => {
        setState({ type: 'Loading' });
        api
          .uploadActivity(
            user.token,
            toTcxString(trackedData),
            activeWorkout.workout?.name ?? null
          )
          .then((response) => {
            if (response.status === ApiStatus.FAILURE) {
              setState({ type: 'Error', msg: response.message });
              toast({
                title: 'Failed to upload activity to Strava',
                description:
                  'Try again, or download the workout as a TCX and upload it manually.',
                isClosable: true,
                duration: 10000,
                status: 'error',
              });
            } else {
              setState({
                type: 'Success',
                activityId: response.data.activity_id,
              });
              toast({
                title: `Activity uploaded to Strava!`,
                isClosable: true,
                duration: 5000,
                status: 'success',
              });
            }
          })
          .catch((err) => {
            console.error(err);
            setState({ type: 'Error', msg: err.toString });
            toast({
              title: `Upload failed : ${err}`,
              isClosable: true,
              duration: 10000,
              status: 'error',
            });
          });
      }}
      leftIcon={<Icon as={Upload} />}
    >
      Upload to Strava
    </Button>
  );
};

type UploadState =
  | { type: 'NotAsked' }
  | { type: 'Loading' }
  | { type: 'Error'; msg: string }
  | { type: 'Success'; activityId: number };
