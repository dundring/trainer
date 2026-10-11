import { Button, Icon } from '@chakra-ui/react';
import { Download } from 'react-bootstrap-icons';
import { useData } from '../../context/DataContext';
import { downloadTcx } from '../../createTcxFile';

export const DownloadTCXButton = ({}: {}) => {
  const { trackedData } = useData();
  return (
    <Button
      width="100%"
      onClick={() => downloadTcx(trackedData)}
      leftIcon={<Icon as={Download} />}
    >
      Download TCX
    </Button>
  );
};
