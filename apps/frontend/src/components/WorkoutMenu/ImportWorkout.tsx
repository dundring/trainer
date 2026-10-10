import * as React from 'react';
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  Text,
} from '@chakra-ui/react';
import { getWorkout } from '../../api';
import { WorkoutToEdit } from '../Modals/WorkoutEditorModal';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api';

export enum ApiStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  LOADING = 'LOADING',
}

interface Props {
  setWorkoutToEdit: (workout: WorkoutToEdit) => void;
  previewFtp: number;
}

export const ImportWorkout = ({ setWorkoutToEdit, previewFtp }: Props) => {
  const { workoutId: workoutIdParam } = useParams();
  const [errorMessage, setErrorMessage] = React.useState('');
  const [workoutIdInput, setWorkoutIdInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const navigate = useNavigate();

  const handleImportWorkout = React.useCallback(
    async (workoutIdOrWorkoutLink: string) => {
      const workoutId = workoutIdOrWorkoutLink.replace(
        `${api.domain}/workout/`,
        ''
      );
      setIsLoading(true);
      const workoutResponse = await getWorkout(workoutId);
      setIsLoading(false);

      switch (workoutResponse.status) {
        case ApiStatus.SUCCESS: {
          setWorkoutToEdit({
            ...workoutResponse.data.workout,
            id: '',
            type: 'new',
            previewFtp,
          });
          navigate('workout');
          return;
        }
        case ApiStatus.FAILURE: {
          setErrorMessage(workoutResponse.message);
          return;
        }
      }
    },
    [setIsLoading, previewFtp, setWorkoutToEdit, navigate]
  );

  React.useEffect(() => {
    if (!workoutIdParam) return;
    setWorkoutIdInput(workoutIdParam);
    handleImportWorkout(workoutIdParam);
  }, [handleImportWorkout, workoutIdParam]);

  const onClickImportWorkout = async () => {
    if (!workoutIdInput) return;
    handleImportWorkout(workoutIdInput);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClickImportWorkout();
      }}
    >
      <FormControl isInvalid={!!errorMessage}>
        <FormLabel>Import workout</FormLabel>
        <HStack>
          <InputGroup>
            <Input
              placeholder="E.g. 7ad16cbc-0708-4ad0-a9da-ea5dfb35d4f2"
              type="workoutIdInput"
              name="workoutIdInput"
              value={workoutIdInput}
              onChange={(e) => {
                setWorkoutIdInput(e.target.value.replace(' ', ''));
                setErrorMessage('');
              }}
            />
          </InputGroup>
          <Button
            isLoading={isLoading}
            disabled={!workoutIdInput}
            onClick={onClickImportWorkout}
          >
            Import
          </Button>
        </HStack>
        {errorMessage ? <Text color="red.500">{errorMessage}</Text> : null}
        <FormHelperText>
          You can import/clone an other user's workout by entering the workout
          id. A workout's id can be found by pressing the copy button on a given
          workout that is stored remotely.
        </FormHelperText>
      </FormControl>
    </form>
  );
};
