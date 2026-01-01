import { AnimatedTabScreen } from '../../src/components/navigation/AnimatedTabScreen';
import { FeedScreen } from "../../src/screens/FeedScreen";

export default function FeedTab() {
  return (
    <AnimatedTabScreen tabName="feed">
      <FeedScreen />
    </AnimatedTabScreen>
  );
}

