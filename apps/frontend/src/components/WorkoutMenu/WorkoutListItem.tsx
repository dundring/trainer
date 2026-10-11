import {
  Button,
  Center,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  Tooltip,
  useClipboard,
  useToast,
} from '@chakra-ui/react';
import { Cloud, Gear, Hdd, Clipboard, Book } from 'react-bootstrap-icons';
import { StoredWorkoutType, Workout, WorkoutType } from '../../types';
import {
  getTotalWorkoutDistance,
  getTotalWorkoutTime,
  secondsToHoursMinutesAndSecondsString,
} from '@dundring/utils';
import * as api from '../../api';

interface Props {
  workout: Workout;
  setActiveWorkout: (workout: Workout) => void;
  onClickEdit: () => void;
  type: StoredWorkoutType;
  ftp: number;
}
export const WorkoutListItem = ({
  workout,
  setActiveWorkout,
  onClickEdit,
  type,
  ftp,
}: Props) => {
  const workoutDuration = getTotalWorkoutTime(workout);
  const { onCopy } = useClipboard(`${api.domain}/workout/${workout.id}`);
  const toast = useToast();

  return (
    <Grid templateColumns="1fr 10fr 3fr">
      <WorkoutIcon type={type} />
      <Stack spacing="0">
        <Heading as="h2" fontSize="2xl">
          {workout.name}
        </Heading>
        <Text>
          Duration: {secondsToHoursMinutesAndSecondsString(workoutDuration)},
          Distance: {getTotalWorkoutDistance(workout, ftp).toFixed(1)} km
        </Text>
      </Stack>
      <HStack>
        {type === 'remote' && (
          <Tooltip label="Copy import link to clipboard. Share this id to allow other people to import this workout.">
            <IconButton
              aria-label="copy"
              icon={<Icon as={Clipboard} />}
              onClick={() => {
                onCopy();
                toast({
                  title: `Copied workout link to clipboard!`,
                  isClosable: true,
                  duration: 2000,
                  status: 'success',
                });
              }}
            />
          </Tooltip>
        )}

        <Button width="100%" onClick={() => setActiveWorkout(workout)}>
          Use workout
        </Button>
        <Tooltip label="Edit workout" placement="right">
          <IconButton
            aria-label="Edit workout"
            icon={<Icon as={Gear} />}
            isRound
            onClick={() => onClickEdit()}
          />
        </Tooltip>
      </HStack>
    </Grid>
  );
};

const WorkoutIcon = ({ type }: { type: StoredWorkoutType }) => {
  const iconAndDescription = (type: StoredWorkoutType) => {
    switch (type) {
      case 'library':
        return {
          icon: Book,
          description: 'Workout is from the workout library',
        };
      case 'local':
        return {
          icon: Hdd,
          description: 'Workout is stored in the browser',
        };
      case 'remote':
        return {
          icon: Cloud,
          description: 'Workout is stored remotely',
        };
    }
  };

  const { icon, description } = iconAndDescription(type);

  return (
    <Tooltip label={description} placement="left">
      <Center>
        <Icon as={icon} />
      </Center>
    </Tooltip>
  );
};
