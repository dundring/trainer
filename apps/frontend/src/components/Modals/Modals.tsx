import { WorkoutEditorModal } from './WorkoutEditorModal';
import { LogModal } from './LogModal';
import { LoginModal } from './LoginModal';
import { ProfileModal } from './ProfileModal';
import { GroupSessionModal } from './GroupSessionModal';
import { WelcomeMessageModal } from './WelcomeMessageModal';
import { FeedbackModal } from './FeedbackModal';
import { MigrationModal } from './MigrationModal';
import { OptionsModal } from './OptionsModal';

export const Modals = () => {
  return (
    <>
      <FeedbackModal />
      <GroupSessionModal />
      <MigrationModal />
      <LogModal />
      <LoginModal />
      <ProfileModal />
      <WorkoutEditorModal />
      <WelcomeMessageModal />
      <OptionsModal />
    </>
  );
};
