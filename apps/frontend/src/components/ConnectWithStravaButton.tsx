import * as React from 'react';
import { chakra, forwardRef, ImageProps, Link } from '@chakra-ui/react';
import logo from '../assets/connect-with-strava.svg';
import { connectStrava } from '../auth';

/** Connects Strava at identity (id.dundring.com), then comes back to this page. */
export const ConnectWithStravaButton = () => {
  return (
    <Link as="button" onClick={() => connectStrava()}>
      <ConnectWithStravaGraphics />
    </Link>
  );
};

const ConnectWithStravaGraphics = forwardRef<ImageProps, 'img'>(
  (props, ref) => {
    return <chakra.img src={logo} ref={ref} {...props} />;
  }
);
