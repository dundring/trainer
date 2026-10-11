import { Center, useColorModeValue } from '@chakra-ui/react';
import { Draggable } from 'react-beautiful-dnd';

interface Props {
  children: React.ReactNode;
  id: string;
  index: number;
}
export const DraggableItem = ({ id, index, children }: Props) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, _snapshot) => (
        <Center
          backgroundColor={bgColor}
          borderRadius="10"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {children}
        </Center>
      )}
    </Draggable>
  );
};
