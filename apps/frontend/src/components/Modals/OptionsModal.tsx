import {
  Center,
  Checkbox,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tooltip,
} from '@chakra-ui/react';
import { useOptionsModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import * as React from 'react';
import { useReadWriteOptions } from '../../context/OptionsContext';

export const OptionsModal = () => {
  const { isOpen } = useOptionsModal();
  const navigate = useNavigate();

  const options = useReadWriteOptions();

  return (
    <Modal isOpen={isOpen} onClose={() => navigate('/')}>
      <ModalOverlay />
      <ModalContent p="5">
        <ModalHeader>Options</ModalHeader>
        <ModalCloseButton />
        <Center>
          <Stack>
            <OptionsCheckbox
              option={options.showIntervalTimer}
              tooltip={
                'Check to have the remaing time of an interval displayed'
              }
              text={'Show remaining time for interval'}
            />
            <OptionsCheckbox
              option={options.showTotalDurationTimer}
              tooltip={
                'Check to have the total duration of a session displayed'
              }
              text={'Show total duration timer'}
            />
          </Stack>
        </Center>
      </ModalContent>
    </Modal>
  );
};

const OptionsCheckbox = (props: {
  option: { value: boolean; set: (b: boolean) => void };
  tooltip: string;
  text: string;
}) => {
  const { option, tooltip, text } = props;
  return (
    // needs shouldWrapChildren to behave correctly on checkboxes
    <Tooltip label={tooltip} shouldWrapChildren>
      <Checkbox
        onChange={(e) => {
          option.set(e.target.checked);
        }}
        isChecked={option.value}
      >
        {text}
      </Checkbox>
    </Tooltip>
  );
};
