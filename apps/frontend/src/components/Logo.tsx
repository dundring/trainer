import * as React from 'react';
import {
  chakra,
  forwardRef,
  ImageProps,
  useColorModeValue,
} from '@chakra-ui/react';
import logoBlack from '../assets/LogoBlack.svg';
import logoWhite from '../assets/LogoWhite.svg';

type LogoVariant = 'black' | 'white';

interface Props {
  variant?: LogoVariant;
}

const getLogo = (variant: LogoVariant) => {
  switch (variant) {
    case 'black':
      return logoBlack;
    case 'white':
      return logoWhite;
  }
};

export const Logo = forwardRef<ImageProps & Props, 'img'>((props, ref) => {
  const themeLogo = useColorModeValue(logoBlack, logoWhite);
  const logo = props.variant ? getLogo(props.variant) : themeLogo;

  return <chakra.img src={logo} ref={ref} {...props} />;
});
