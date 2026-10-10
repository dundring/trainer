import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import * as React from 'react';
import { ArrowLeft } from 'react-bootstrap-icons';
import { WorkoutOverview } from '../WorkoutMenu/WorkoutOverview';
import { Workout, WorkoutType } from '../../types';
import { WorkoutEditor } from '../WorkoutMenu/WorkoutEditor';
import { useUser } from '../../context/UserContext';
import { useWorkoutEditorModal } from '../../context/ModalContext';
import { useActiveWorkout } from '../../context/ActiveWorkoutContext';
import { useNavigate } from 'react-router-dom';

export interface WorkoutToEdit extends Workout {
  type: WorkoutType;
  previewFtp: number;
}
export const WorkoutEditorModal = () => {
  const { isOpen } = useWorkoutEditorModal();
  const { refetchData: refetchUserData } = useUser();
  const [workoutToEdit, setWorkoutToEdit] =
    React.useState<WorkoutToEdit | null>(null);
  const { setActiveWorkout } = useActiveWorkout();
  const [isWorkoutUnsaved, setIsWorkoutUnsaved] = React.useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const navigate = useNavigate();

  const onClose = () => {
    navigate('/');
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={() =>
        isWorkoutUnsaved ? setShowDiscardDialog(true) : onClose()
      }
      size="4xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {workoutToEdit ? (
            <>
              <IconButton
                variant="ghost"
                aria-label="Back to overview"
                mr="1"
                onClick={() => {
                  navigate('/workout');
                  setIsWorkoutUnsaved(false);
                  setWorkoutToEdit(null);
                }}
                icon={<Icon as={ArrowLeft} />}
              />
              Edit workout
            </>
          ) : (
            <>Your workouts</>
          )}
        </ModalHeader>
        <ModalCloseButton />
        {workoutToEdit ? (
          <WorkoutEditor
            workout={workoutToEdit}
            closeEditor={() => {
              refetchUserData();
              setWorkoutToEdit(null);
            }}
            closeModal={onClose}
            setIsWorkoutUnsaved={setIsWorkoutUnsaved}
          />
        ) : (
          <WorkoutOverview
            setActiveWorkout={(workout: Workout) => {
              setActiveWorkout(workout);
              onClose();
            }}
            setWorkoutToEdit={setWorkoutToEdit}
          />
        )}
      </ModalContent>
      <AlertDialog
        isOpen={showDiscardDialog}
        leastDestructiveRef={cancelRef}
        onClose={() => setShowDiscardDialog(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Discard workout changes
            </AlertDialogHeader>

            <AlertDialogBody>
              You have unsaved changes in this workout. Closing this would
              discard the changes.
            </AlertDialogBody>

            <AlertDialogFooter>
              <HStack>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    setShowDiscardDialog(false);
                    onClose();
                  }}
                  ml={3}
                >
                  Yes, discard the changes
                </Button>
                <Button
                  ref={cancelRef}
                  onClick={() => setShowDiscardDialog(false)}
                >
                  Cancel
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Modal>
  );
};
