import { useDisclosure } from '@chakra-ui/hooks';
import * as React from 'react';

interface Modal {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const ModalContext = React.createContext<{
  feedbackModal: Modal;
  groupSessionModal: Modal;
  logModal: Modal;
  loginModal: Modal;
  migrationModal: Modal;
  profileModal: Modal;
  welcomeMessageModal: Modal;
  workoutEditorModal: Modal;
  optionsModal: Modal;
} | null>(null);

export const ModalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const logModal: Modal = useDisclosure();
  const loginModal: Modal = useDisclosure();
  const migrationModal: Modal = useDisclosure();
  const profileModal: Modal = useDisclosure();
  const groupSessionModal: Modal = useDisclosure();
  const welcomeMessageModal: Modal = useDisclosure();
  const workoutEditorModal: Modal = useDisclosure();
  const feedbackModal: Modal = useDisclosure();
  const optionsModal: Modal = useDisclosure();

  return (
    <ModalContext.Provider
      value={{
        feedbackModal,
        groupSessionModal,
        logModal,
        loginModal,
        migrationModal,
        profileModal,
        welcomeMessageModal,
        workoutEditorModal,
        optionsModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useFeedbackModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useFeedbackModal must be used within a ModalContextProvider'
    );
  }
  return context.feedbackModal;
};

export const useLogModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error('useLogModal must be used within a ModalContextProvider');
  }
  return context.logModal;
};

export const useLoginModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error('useLoginModal must be used within a ModalContextProvider');
  }
  return context.loginModal;
};

export const useMigrationModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useMigrationModal must be used within a ModalContextProvider'
    );
  }
  return context.migrationModal;
};

export const useProfileModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useProfileModal must be used within a ModalContextProvider'
    );
  }
  return context.profileModal;
};

export const useGroupSessionModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useGroupSessionModal must be used within a ModalContextProvider'
    );
  }
  return context.groupSessionModal;
};

export const useWelcomeMessageModal = () => {
  const CURRENT_VERSION = 1;
  const KEY = 'lastViewedVersion';
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useWelcomeMessageModal must be used within a ModalContextProvider'
    );
  }
  return {
    shouldShowWelcomeMessageHint:
      parseInt(localStorage.getItem(KEY) || '0') < CURRENT_VERSION,
    isOpen: context.welcomeMessageModal.isOpen,
    onOpen: context.welcomeMessageModal.onOpen,
    onClose: () => {
      localStorage.setItem(KEY, JSON.stringify(CURRENT_VERSION));
      context.welcomeMessageModal.onClose();
    },
  };
};

export const useWorkoutEditorModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useWorkoutEditorModal must be used within a ModalContextProvider'
    );
  }
  return context.workoutEditorModal;
};

export const useOptionsModal = () => {
  const context = React.useContext(ModalContext);
  if (context === null) {
    throw new Error(
      'useOptionsModal must be used within a ModalContextProvider'
    );
  }
  return context.optionsModal;
};
