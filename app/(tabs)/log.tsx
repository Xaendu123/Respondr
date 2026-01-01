import { AnimatedTabScreen } from '../../src/components/navigation/AnimatedTabScreen';
import { LogActivityScreen } from "../../src/screens/LogActivityScreen";

export default function LogTab() {
  return (
    <AnimatedTabScreen tabName="log">
      <LogActivityScreen />
    </AnimatedTabScreen>
  );
}

