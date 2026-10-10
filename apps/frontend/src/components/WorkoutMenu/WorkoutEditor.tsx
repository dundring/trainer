import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightAddon,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from '@chakra-ui/react';
import * as React from 'react';
import { Workout, WorkoutPart } from '../../types';
import { templateColumns, WorkoutIntervalInput } from './WorkoutIntervalInput';
import { DropResult } from 'react-beautiful-dnd';
import { DraggableList } from './DraggableList';
import { DraggableItem } from './DraggableItem';
import { useUser } from '../../context/UserContext';
import * as api from '../../api';
import { CloudUpload, Hdd, Trash } from 'react-bootstrap-icons';
import { WorkoutToEdit } from '../Modals/WorkoutEditorModal';
import { useActiveWorkout } from '../../context/ActiveWorkoutContext';
import { createZoneTableInfo } from '../../utils/zones';
import {
  getTotalWorkoutTime,
  getTotalWorkoutDistance,
  secondsToHoursMinutesAndSecondsString,
} from '@dundring/utils';
import { ApiStatus } from '@dundring/types';
import { parseInputAsInt } from '../../utils/general';

interface Props {
  workout: WorkoutToEdit;
  closeEditor: () => void;
  closeModal: () => void;
  setIsWorkoutUnsaved: (isUnsaved: boolean) => void;
}

interface EditableWorkoutPart extends WorkoutPart {
  id: number;
}
interface EditableWorkout extends Workout {
  parts: EditableWorkoutPart[];
}

export const WorkoutEditor = ({
  workout: loadedWorkout,
  closeEditor,
  closeModal,
  setIsWorkoutUnsaved,
}: Props) => {
  const { activeFtp, setActiveFtp, setActiveWorkout } = useActiveWorkout();
  const { user, saveLocalWorkout, deleteLocalWorkout } = useUser();
  const toast = useToast();
  const token = (user.loggedIn && user.token) || null;
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const canSaveLocally =
    loadedWorkout.type === 'new' || loadedWorkout.type === 'local';

  const canSaveRemotely =
    token && (loadedWorkout.type === 'new' || loadedWorkout.type === 'remote');

  const isStored =
    (token && loadedWorkout.type === 'remote') ||
    loadedWorkout.type === 'local';

  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const saveRemotely = async (workoutToSave: Workout) => {
    if (token) {
      const res = await api.saveWorkout(token, { workout: workoutToSave });
      if (res.status === ApiStatus.FAILURE) {
        toast({
          title: `Save workout remotely failed`,
          isClosable: true,
          duration: 5000,
          status: 'error',
        });
        return;
      }
      setIsWorkoutUnsaved(false);
      closeEditor();
    }
  };

  const deleteRemotely = async () => {
    if (token) {
      const res = await api.deleteWorkout(token, workout.id);
      if (res.status === ApiStatus.FAILURE) {
        toast({
          title: `Deleting workout failed`,
          isClosable: true,
          duration: 5000,
          status: 'error',
        });
        return;
      }
      toast({
        title: `The workout was deleted (${workout.name})`,
        isClosable: true,
        duration: 5000,
        status: 'success',
      });
      setIsWorkoutUnsaved(false);
      closeEditor();
    }
  };

  const deleteLocally = (workoutId: string) => {
    deleteLocalWorkout(workoutId);
    toast({
      title: `The workout was deleted (${workout.name})`,
      isClosable: true,
      duration: 5000,
      status: 'success',
    });
    setIsWorkoutUnsaved(false);
    closeEditor();
  };

  const [ftp, setFtp] = React.useState('' + activeFtp);

  const ftpValue = parseInputAsInt(ftp);

  const [workout, setWorkout] = React.useState<EditableWorkout>({
    ...loadedWorkout,
    parts: loadedWorkout.parts.map((part, i) => ({ ...part, id: i })),
  });

  const workoutIsUnsaved =
    loadedWorkout.type === 'new' ||
    !editableWorkoutIsEqualToLoaded(workout, loadedWorkout);

  React.useEffect(() => {
    setIsWorkoutUnsaved(workoutIsUnsaved);
  }, [workoutIsUnsaved, setIsWorkoutUnsaved]);

  const totalDuration = getTotalWorkoutTime(workout);

  function onDragEnd(result: DropResult) {
    const { destination, source } = result;
    // reorderedParts
    if (!destination) {
      return;
    }
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const updatedArray = [...workout.parts];
    updatedArray.splice(source.index, 1);
    updatedArray.splice(destination.index, 0, workout.parts[source.index]);
    setWorkout((workout) => ({ ...workout, parts: updatedArray }));
  }

  const getNextWorkoutPartsId = (workoutParts: EditableWorkoutPart[]) =>
    workoutParts.reduce((maxId, cur) => Math.max(maxId, cur.id), 0) + 1;

  const zoneTableInfo = createZoneTableInfo(
    workout.parts,
    totalDuration,
    ftpValue
  );

  return (
    <Stack p="5">
      <FormControl id="workoutName">
        <FormLabel>Workout name</FormLabel>
        <Input
          autoFocus={loadedWorkout.type === 'new'}
          value={workout.name}
          onChange={(e) =>
            setWorkout((workout) => ({ ...workout, name: e.target.value }))
          }
          placeholder="Workout name"
        />
      </FormControl>
      <FormControl id="ftp">
        <FormLabel>Active FTP</FormLabel>
        <InputGroup>
          <Input
            value={ftp}
            onChange={(e) => setFtp(e.target.value)}
            onBlur={() => setActiveFtp(parseInputAsInt(ftp))}
          />
          <InputRightAddon children="W" />
        </InputGroup>
      </FormControl>

      {workout.parts.length > 0 ? (
        <Grid templateColumns={templateColumns} gap="1" mb="2">
          <Text />
          <Text>Minutes</Text>
          <Text>Seconds</Text>
          <Text />
          <Text>Power</Text>
        </Grid>
      ) : null}
      <DraggableList onDragEnd={onDragEnd}>
        {workout.parts.map((part, index) => (
          <DraggableItem id={part.id + ''} index={index} key={part.id}>
            <WorkoutIntervalInput
              key={part.id}
              removeWorkoutPart={() =>
                setWorkout((workout) => ({
                  ...workout,
                  parts: workout.parts.filter((_part, i) => index !== i),
                }))
              }
              duplicateWorkoutPart={() =>
                setWorkout((workout) => {
                  const newParts = [...workout.parts];
                  newParts.splice(index + 1, 0, {
                    ...workout.parts[index],
                    id: getNextWorkoutPartsId(workout.parts),
                  });
                  return {
                    ...workout,
                    parts: newParts,
                  };
                })
              }
              setWorkoutPart={(workoutPart: WorkoutPart) => {
                setWorkout((workout) => {
                  return {
                    ...workout,
                    parts: workout.parts.map((part, i) =>
                      index === i ? { ...part, ...workoutPart } : part
                    ),
                  };
                });
              }}
              workoutPart={part}
              ftp={ftpValue}
              isLastWorkoutPart={workout.parts.length === 1}
            />
          </DraggableItem>
        ))}
      </DraggableList>

      <Button
        onClick={() =>
          setWorkout((workout) => ({
            ...workout,
            parts: [
              ...workout.parts,
              {
                duration: 5 * 60,
                targetPower: 70,
                ...(workout.parts.length > 0
                  ? workout.parts[workout.parts.length - 1]
                  : {}),
                id: getNextWorkoutPartsId(workout.parts),
                type: 'steady',
              },
            ],
          }))
        }
      >
        Add part
      </Button>

      <Text fontSize="small">
        Tip: Use 0 as power target for <em>Free mode</em>
      </Text>

      <Text fontWeight="bold">
        Total duration {secondsToHoursMinutesAndSecondsString(totalDuration)}
      </Text>
      <Text>
        Estimated distance{' '}
        {getTotalWorkoutDistance(workout, ftpValue).toFixed(1)} km
      </Text>
      <FormControl>
        <HStack>
          {canSaveRemotely ? (
            <Button
              onClick={() => saveRemotely(workout)}
              leftIcon={<Icon as={CloudUpload} />}
            >
              Save
            </Button>
          ) : null}
          {canSaveLocally ? (
            <Button
              onClick={() => {
                saveLocalWorkout(workout);
                setIsWorkoutUnsaved(false);
                closeEditor();
              }}
              leftIcon={<Icon as={Hdd} />}
            >
              Save locally
            </Button>
          ) : null}
          {isStored ? (
            <Button
              onClick={() => {
                const nonDuplicatedName =
                  workout.name === loadedWorkout.name
                    ? `${workout.name}(2)`
                    : workout.name;
                const newWorkout = {
                  ...workout,
                  id: '',
                  name: nonDuplicatedName,
                };
                const save =
                  loadedWorkout.type === 'remote'
                    ? saveRemotely
                    : saveLocalWorkout;
                save(newWorkout);
                setIsWorkoutUnsaved(false);
                closeEditor();
              }}
              leftIcon={
                <Icon
                  as={loadedWorkout.type === 'remote' ? CloudUpload : Hdd}
                />
              }
            >
              Save {loadedWorkout.type === 'remote' ? '' : 'locally'} as new
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setActiveWorkout(workout);
              setIsWorkoutUnsaved(false);
              closeEditor();
              closeModal();
            }}
          >
            Use without saving
          </Button>

          {isStored ? (
            <Button
              onClick={() => setShowDeleteDialog(true)}
              leftIcon={<Icon as={Trash} />}
              colorScheme={'red'}
            >
              Delete workout
            </Button>
          ) : null}

          <Button
            onClick={() => {
              setIsWorkoutUnsaved(false);
              closeEditor();
            }}
          >
            Cancel
          </Button>
        </HStack>
        {!user.loggedIn ? (
          <FormHelperText>
            You can create an account to store your workouts remotely, making
            them accessible from any browser you use.
          </FormHelperText>
        ) : null}
      </FormControl>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Zone</Th>
            <Th whiteSpace="nowrap">Range %</Th>
            <Th whiteSpace="nowrap">Range W</Th>
            <Th textAlign="right">Duration</Th>
            <Th>Percentage</Th>
          </Tr>
        </Thead>
        <Tbody>
          {zoneTableInfo.map(
            ({ zone, range, rangePct, duration, pctDuration, description }) => (
              <Tr key={zone}>
                <Tooltip label={description}>
                  <Td>{zone}</Td>
                </Tooltip>
                <Td whiteSpace="nowrap">
                  {rangePct.lower}
                  {rangePct.upper ? '-' + rangePct.upper : '+'}%
                </Td>
                <Td whiteSpace="nowrap">
                  {range.lower}
                  {range.upper ? '-' + range.upper : '+'} w
                </Td>
                <Td textAlign="right">{duration}</Td>
                <Td>{pctDuration}%</Td>
              </Tr>
            )
          )}
        </Tbody>
        <Tfoot>
          <Tr>
            <Td fontWeight="bold">Total</Td>
            <Td></Td>
            <Td></Td>
            <Td fontWeight="bold" textAlign="right">
              {secondsToHoursMinutesAndSecondsString(totalDuration)}
            </Td>
          </Tr>
        </Tfoot>
      </Table>
      <AlertDialog
        isOpen={showDeleteDialog}
        leastDestructiveRef={cancelRef}
        onClose={() => setShowDeleteDialog(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete workout
            </AlertDialogHeader>

            <AlertDialogBody>
              This will delete the workout. Are you sure?
            </AlertDialogBody>

            <AlertDialogFooter>
              <HStack>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    if (loadedWorkout.type === 'remote') {
                      deleteRemotely();
                    } else if (loadedWorkout.type === 'local') {
                      deleteLocally(loadedWorkout.id);
                    }
                  }}
                  ml={3}
                >
                  Yes, delete the workout
                </Button>
                <Button
                  ref={cancelRef}
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
};

const editableWorkoutIsEqualToLoaded = (
  editable: EditableWorkout,
  loaded: WorkoutToEdit
) => {
  if (editable.name !== loaded.name) return false;
  if (editable.parts.length !== loaded.parts.length) return false;

  for (let i = 0; i < editable.parts.length; i++) {
    const editablePart = editable.parts[i];
    const loadedPart = loaded.parts[i];

    if (editablePart.duration !== loadedPart.duration) return false;
    if (editablePart.targetPower !== loadedPart.targetPower) return false;
  }

  return true;
};
