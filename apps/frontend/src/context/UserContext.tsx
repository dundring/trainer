import * as React from 'react';
import useSWR from 'swr';
import { useToast } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { settingUpProfile } from '@dundring/utils';
import * as api from '../api';
import * as auth from '../auth';
import { LoggedInUser, UserContextType, Workout } from '../types';

export const defaultUser: UserContextType = {
  loggedIn: false,
};

const UserContext = React.createContext<{
  user: UserContextType;
  workouts: Workout[];
  localWorkouts: Workout[];
  saveLocalWorkout: (workout: Workout) => void;
  deleteLocalWorkout: (workoutId: string) => void;
  setUser: (user: UserContextType) => void;
  signOut: () => void;
  refetchData: () => void;
} | null>(null);

const loadUser = async (): Promise<LoggedInUser | null> => {
  const [me, userinfo] = await Promise.all([
    api.getMe(),
    api.getUserinfo().catch(() => null),
  ]);
  if (me.status !== 'SUCCESS') return null;

  return {
    loggedIn: true,
    username: me.data.username,
    ftp: me.data.ftp,
    workouts: [],
    strava: userinfo?.strava
      ? {
          athleteId: userinfo.strava.athlete_id,
          canUpload: userinfo.strava.scopes.includes('activity:write'),
        }
      : null,
  };
};

export const UserContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = React.useState<UserContextType>(defaultUser);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Runs once on page load: finishes a sign-in or a Strava connect coming back
  // from identity, or resumes a stored session.
  React.useEffect(() => {
    const returnTo =
      new URLSearchParams(location.search).get('return_to') || '/';

    switch (location.pathname) {
      case auth.callbackPath:
        auth
          .handleCallback()
          .then(async (path) => {
            const loaded = path ? await loadUser() : null;
            if (!loaded) {
              toast({
                title: 'Sign in failed',
                description: 'Try again.',
                isClosable: true,
                duration: 10000,
                status: 'error',
              });
              navigate('/', { replace: true });
              return;
            }
            setUser(loaded);
            const [pathname, query] = path!.split('?');
            // Signed in on the way to connecting Strava (see auth.connectStrava).
            if (pathname === auth.connectStravaPath) {
              const next = new URLSearchParams(query).get('return_to') || '/';
              window.location.assign(auth.connectStravaUrl(next));
              return;
            }
            // New users get a placeholder username and pick their own.
            if (settingUpProfile(loaded)) {
              navigate('/profile', { replace: true });
              return;
            }
            toast({
              title: `Logged in as ${loaded.username}`,
              isClosable: true,
              duration: 5000,
              status: 'success',
            });
            navigate(path!, { replace: true });
          })
          .catch(console.error);
        return;
      case auth.connectedPath:
        // Sign in again rather than reuse the tokens: connecting can switch to
        // another (existing) Dundring account, see identity's /account/switch.
        auth.login(returnTo);
        return;
    }

    // Tokens from the trainer's own login, before it moved to identity.
    if (localStorage['usertoken']) {
      localStorage.removeItem('usertoken');
      if (!auth.hasSession()) {
        toast({
          title: 'Dundring has a new sign in',
          description:
            'The trainer and dundring.com now share one login. Sign in again; your workouts are still here.',
          isClosable: true,
          duration: null,
          status: 'info',
        });
      }
    }

    if (auth.hasSession()) {
      loadUser()
        .then((loaded) => loaded && setUser(loaded))
        .catch(console.error);
    }
  }, []);

  const { data: userWorkouts, mutate: refetchWorkouts } = useSWR(
    ['/me/workouts', user.loggedIn],
    () => (user.loggedIn ? api.fetchMyWorkouts() : null)
  );

  const signOut = () => {
    auth.logout();
    setUser(defaultUser);
  };

  const [localWorkouts, setLocalWorkouts] = React.useState<Workout[]>(
    localStorage['workouts'] ? JSON.parse(localStorage['workouts']) : []
  );

  const deleteLocalWorkout = (workoutId: string) => {
    setLocalWorkouts((localWorkouts) => {
      const filteredWorkouts = localWorkouts.filter(
        (workout) => workout.id !== workoutId
      );
      localStorage['workouts'] = JSON.stringify(filteredWorkouts);
      return JSON.parse(localStorage['workouts']);
    });
  };

  const saveLocalWorkout = (workout: Workout) => {
    setLocalWorkouts((localWorkouts) => {
      if (workout.id) {
        const updatedWorkouts = [...localWorkouts].map((w) =>
          workout.id === w.id ? workout : w
        );
        localStorage['workouts'] = JSON.stringify(updatedWorkouts);
      } else {
        const updatedWorkouts = [
          ...localWorkouts,
          {
            ...workout,
            id:
              localWorkouts.reduce(
                (maxId, cur) => Math.max(maxId, parseInt(cur.id)),
                0
              ) + 1,
          },
        ];

        localStorage['workouts'] = JSON.stringify(updatedWorkouts);
      }
      return JSON.parse(localStorage['workouts']);
    });
  };

  const workouts =
    (userWorkouts &&
      userWorkouts.status === 'SUCCESS' &&
      userWorkouts.data.workouts) ||
    [];

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        signOut,
        workouts,
        refetchData: () => {
          console.log('refetch user data');
          refetchWorkouts();
        },
        localWorkouts,
        saveLocalWorkout,
        deleteLocalWorkout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
};
