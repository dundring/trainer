import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { useWebsocket } from '../../context/WebsocketContext';
import { GroupSessionOverview } from '../GroupSession/GroupSessionOverview';
import { CreateOrJoinGroupSession } from '../GroupSession/CreateOrJoinGroupSession';
import { useGroupSessionModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';

export const GroupSessionModal = () => {
  const { isOpen } = useGroupSessionModal();
  const navigate = useNavigate();

  const { activeGroupSession } = useWebsocket();
  return (
    <Modal isOpen={isOpen} onClose={() => navigate('/')}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Group session</ModalHeader>
        <ModalCloseButton />
        {activeGroupSession ? (
          <GroupSessionOverview />
        ) : (
          <CreateOrJoinGroupSession />
        )}
      </ModalContent>
    </Modal>
  );
};
