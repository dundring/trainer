import { Text } from '@chakra-ui/layout';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { useMigrationModal } from '../../context/ModalContext';

export const MigrationModal = () => {
  const { isOpen, onClose } = useMigrationModal();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>This page is moving to trainer.dundring.com!</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="6">
          <Text pb="4">
            dundring.com has been the home of this free and open source trainer
            application since 2021, and now it's time to evolve a bit!
          </Text>

          <Text pb="4">
            During the last years, we have been wanting to create more useful
            and fun cycling related applications, but we have been reluctant to
            add these to this trainer application. After lots of thinking, we
            have decided that the best alternative is to move this application
            to its own domain to make it possible to rework what dundring.com
            should be, without ruining the trainer.
          </Text>

          <Text pb="4">
            Our plan moving forward is to make dundring.com a place for a
            collection of cycling related applications, and this move is an
            important part of making that possible.
          </Text>

          <Text pb="4">
            <b>TLDR;</b> This application will continue to be free, open source
            and live at trainer.dundring.com and we're going to create more
            cycling related applications over at dundring.com – stay tuned!
          </Text>

          <Text>- Sivert</Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
