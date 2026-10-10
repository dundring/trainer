import {
  Button,
  Center,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightAddon,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import * as React from 'react';
import { PencilSquare } from 'react-bootstrap-icons';
import { useActiveWorkout } from '../../context/ActiveWorkoutContext';
import { useUser } from '../../context/UserContext';
import { StoredWorkoutType, Workout } from '../../types';
import { parseInputAsInt } from '../../utils/general';
import { WorkoutToEdit } from '../Modals/WorkoutEditorModal';
import { defaultWorkouts } from './defaultWorkouts';
import { ImportWorkout } from './ImportWorkout';
import { WorkoutListItem } from './WorkoutListItem';
import { stringToRouteName } from '../../gps';
import ZwoFileUpload from '../ZwoFileUpload';
import { useActiveRoute } from '../../hooks/useActiveRoute';

interface Props {
  setActiveWorkout: (workout: Workout, ftp: number) => void;
  setWorkoutToEdit: (workout: WorkoutToEdit) => void;
}

type WorkoutWithType = {
  workout: Workout;
  type: StoredWorkoutType;
};

export const WorkoutOverview = ({
  setWorkoutToEdit,
  setActiveWorkout,
}: Props) => {
  const { workouts, localWorkouts } = useUser();
  const { activeWorkout, activeFtp, setActiveFtp } = useActiveWorkout();
  const [previewFtp, setPreviewFtp] = React.useState('' + activeFtp);
  const previewFtpAsNumber = parseInputAsInt(previewFtp);
  const { activeRoute, setActiveRoute } = useActiveRoute();

  const allUserWorkouts: WorkoutWithType[] = [
    ...workouts.map((workout) => ({
      workout,
      type: 'remote' as StoredWorkoutType,
    })),
    ...localWorkouts.map((workout) => ({
      workout,
      type: 'local' as StoredWorkoutType,
    })),
  ];

  return (
    <Stack p="5">
      <Button
        fontSize="xl"
        mb="5"
        rightIcon={<Icon as={PencilSquare} />}
        onClick={() =>
          setWorkoutToEdit({
            name: 'New workout',
            parts: [
              {
                duration: 5 * 60,
                targetPower: 70,
                type: 'steady',
              },
            ],
            id: '',
            type: 'new',
            previewFtp: previewFtpAsNumber,
          })
        }
      >
        Create new workout
      </Button>
      <EditCurrentWorkoutButton
        currentWorkout={activeWorkout.workout}
        setWorkoutToEdit={setWorkoutToEdit}
        allUserWorkouts={allUserWorkouts}
        previewFtp={previewFtpAsNumber}
      />
      <FormControl id="ftp">
        <FormLabel>Active FTP</FormLabel>
        <InputGroup>
          <Input
            value={previewFtp}
            onChange={(e) => setPreviewFtp(e.target.value)}
            onBlur={(_) => setActiveFtp(parseInputAsInt(previewFtp))}
          />
          <InputRightAddon children="W" />
        </InputGroup>
        <FormHelperText>
          This value will be used as your FTP for this session. You can change
          your actual FTP on your profile page
        </FormHelperText>
      </FormControl>
      <FormControl id="route">
        <FormLabel>Active route</FormLabel>
        <Select
          onChange={(e) => setActiveRoute(stringToRouteName(e.target.value))}
          value={activeRoute.name}
        >
          <option value="zap">Zap (10 km)</option>
          <option value="D">D (10 km)</option>
        </Select>
      </FormControl>
      {allUserWorkouts.length > 0 && <Divider />}
      {allUserWorkouts.map(({ workout, type }, i) => (
        <WorkoutListItem
          key={i}
          type={type}
          workout={workout}
          setActiveWorkout={(workout: Workout) =>
            setActiveWorkout(workout, previewFtpAsNumber)
          }
          onClickEdit={() => {
            setWorkoutToEdit({
              ...workout,
              type,
              previewFtp: previewFtpAsNumber,
            });
          }}
          ftp={previewFtpAsNumber}
        />
      ))}
      <Divider />
      <Center>
        <Text size="5xl">Predefined workouts</Text>
      </Center>
      {defaultWorkouts.map((workout, i) => (
        <WorkoutListItem
          key={i}
          type="library"
          workout={workout}
          setActiveWorkout={(workout: Workout) =>
            setActiveWorkout(workout, previewFtpAsNumber)
          }
          onClickEdit={() => {
            setWorkoutToEdit({
              ...workout,
              type: 'new',
              previewFtp: previewFtpAsNumber,
            });
          }}
          ftp={previewFtpAsNumber}
        />
      ))}
      <Divider />
      <ZwoFileUpload
        setWorkoutToEdit={setWorkoutToEdit}
        previewFtp={previewFtpAsNumber}
      />
      <Divider />
      <ImportWorkout
        setWorkoutToEdit={setWorkoutToEdit}
        previewFtp={previewFtpAsNumber}
      />
    </Stack>
  );
};

type EditCurrentWorkoutButtonProps = {
  currentWorkout: Workout | null;
  allUserWorkouts: WorkoutWithType[];
  previewFtp: number;
  setWorkoutToEdit: (workout: WorkoutToEdit) => void;
};

const EditCurrentWorkoutButton = (props: EditCurrentWorkoutButtonProps) => {
  const { currentWorkout, allUserWorkouts, setWorkoutToEdit, previewFtp } =
    props;

  if (!currentWorkout) return null;
  const currentWorkoutType =
    currentWorkout?.id === ''
      ? 'new'
      : allUserWorkouts.find(
          (userWorkout) => userWorkout.workout.id === currentWorkout?.id
        )?.type;
  if (!currentWorkoutType) return null;

  return (
    <Button
      fontSize="xl"
      mb="5"
      rightIcon={<Icon as={PencilSquare} />}
      onClick={() =>
        setWorkoutToEdit({
          ...currentWorkout,
          previewFtp,
          type: currentWorkoutType,
        })
      }
    >
      Edit current active workout{' '}
      {currentWorkoutType === 'new' ? '' : `: ${currentWorkout.name}`}
    </Button>
  );
};
