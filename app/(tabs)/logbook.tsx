import { AnimatedTabScreen } from '../../src/components/navigation/AnimatedTabScreen';
import { LogbookScreen } from '../../src/screens/LogbookScreen';

export default function LogbookTab() {
  return (
    <AnimatedTabScreen tabName="logbook">
      <LogbookScreen />
    </AnimatedTabScreen>
  );
}

