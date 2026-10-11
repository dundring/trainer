import * as React from 'react';
import { chakra, forwardRef, ImageProps, Link } from '@chakra-ui/react';
import logo from '../assets/connect-with-strava.svg';
import { getEnv } from '../utils/environment';

export const getStravaAuthorizeUrl = (params: { forcePrompt: boolean }) => {
  const clientId = getEnv().stravaClientId;
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${location.origin}/auth/strava&response_type=code&scope=read,activity:write&approval_prompt=${params.forcePrompt ? 'force' : 'auto'}`;
};

export const ConnectWithStravaButton = () => {
  return (
    <Link href={getStravaAuthorizeUrl({ forcePrompt: false })}>
      <ConnectWithStravaGraphics />
    </Link>
  );
};

const ConnectWithStravaGraphics = forwardRef<ImageProps, 'img'>(
  (props, ref) => {
    return <chakra.img src={logo} ref={ref} {...props} />;
  }
);
