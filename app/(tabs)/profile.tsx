import { AnimatedTabScreen } from '../../src/components/navigation/AnimatedTabScreen';
import { ProfileScreen } from "../../src/screens/ProfileScreen";

export default function ProfileTab() {
  return (
    <AnimatedTabScreen tabName="profile">
      <ProfileScreen />
    </AnimatedTabScreen>
  );
}

