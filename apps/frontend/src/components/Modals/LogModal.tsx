import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useLogs } from '../../context/LogContext';
import { useLogModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import { timestampToFormattedHHMMSS } from '@dundring/utils';

export const LogModal = () => {
  const { isOpen } = useLogModal();
  const { loggedEvents } = useLogs();
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={() => navigate('/')} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Logs</ModalHeader>
        <ModalCloseButton />
        <Table>
          <Thead>
            <Tr>
              <Th>Timestamp</Th>
              <Th>Message</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loggedEvents.map(({ timestamp, msg }) => (
              <Tr key={timestamp.getTime()} m={0}>
                <Td paddingY="2">{timestampToFormattedHHMMSS(timestamp)}</Td>
                <Td paddingY="2">{msg}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </ModalContent>
    </Modal>
  );
};
