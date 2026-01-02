/**
 * SWIPEABLE CARDS COMPONENT
 *
 * A horizontal swipeable container for displaying cards that can be
 * swiped left/right to reveal different content.
 */

import React, { useCallback, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH - 32; // Fallback before layout measurement

export interface SwipeableCardsProps {
  children: React.ReactNode[];
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  showIndicators?: boolean;
  onPageChange?: (index: number) => void;
}

export function SwipeableCards({
  children,
  style,
  cardStyle,
  showIndicators = true,
  onPageChange,
}: SwipeableCardsProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(DEFAULT_CARD_WIDTH);
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const cardCount = React.Children.count(children);
  const cardWidth = containerWidth;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  }, [containerWidth]);

  const updateActiveIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      onPageChange?.(index);
    },
    [onPageChange]
  );

  const panGesture = Gesture.Pan()
    // Only activate gesture after 10px horizontal movement
    // Fail (pass through to parent ScrollView) if vertical movement exceeds 5px first
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newValue = contextX.value + event.translationX;
      // Limit scrolling to valid range with resistance at edges
      const maxScroll = 0;
      const minScroll = -(cardCount - 1) * cardWidth;

      if (newValue > maxScroll) {
        // Resistance at left edge
        translateX.value = newValue * 0.3;
      } else if (newValue < minScroll) {
        // Resistance at right edge
        translateX.value = minScroll + (newValue - minScroll) * 0.3;
      } else {
        translateX.value = newValue;
      }
    })
    .onEnd((event) => {
      const currentPage = Math.round(-translateX.value / cardWidth);
      let targetPage = currentPage;

      // Determine if we should snap to next/previous page
      if (Math.abs(event.velocityX) > 500) {
        // Fast swipe
        if (event.velocityX > 0 && currentPage > 0) {
          targetPage = currentPage - 1;
        } else if (event.velocityX < 0 && currentPage < cardCount - 1) {
          targetPage = currentPage + 1;
        }
      } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Slow swipe past threshold
        if (event.translationX > 0 && currentPage > 0) {
          targetPage = currentPage - 1;
        } else if (event.translationX < 0 && currentPage < cardCount - 1) {
          targetPage = currentPage + 1;
        }
      }

      // Clamp to valid range
      targetPage = Math.max(0, Math.min(cardCount - 1, targetPage));

      translateX.value = withSpring(-targetPage * cardWidth, {
        damping: 25,
        stiffness: 120,
        mass: 0.8,
      });

      runOnJS(updateActiveIndex)(targetPage);
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const styles = createStyles(theme, cardWidth, cardCount);

  return (
    <GestureHandlerRootView style={[styles.container, style]} onLayout={handleLayout}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardsContainer, animatedContainerStyle]}>
          {React.Children.map(children, (child, index) => (
            <View key={index} style={[styles.card, cardStyle]}>
              {child}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {showIndicators && cardCount > 1 && (
        <View style={styles.indicatorsContainer}>
          {Array.from({ length: cardCount }).map((_, index) => (
            <Indicator
              key={index}
              index={index}
              activeIndex={activeIndex}
              translateX={translateX}
              cardWidth={cardWidth}
            />
          ))}
        </View>
      )}
    </GestureHandlerRootView>
  );
}

interface IndicatorProps {
  index: number;
  activeIndex: number;
  translateX: SharedValue<number>;
  cardWidth: number;
}

function Indicator({ index, translateX, cardWidth }: IndicatorProps) {
  const { theme } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const progress = -translateX.value / cardWidth;
    const distance = Math.abs(progress - index);

    const scale = interpolate(distance, [0, 1], [1.2, 1], 'clamp');
    const opacity = interpolate(distance, [0, 1], [1, 0.4], 'clamp');
    const width = interpolate(distance, [0, 1], [20, 8], 'clamp');

    return {
      transform: [{ scale }],
      opacity,
      width,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.primary,
          marginHorizontal: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  cardWidth: number,
  cardCount: number
) {
  return StyleSheet.create({
    container: {
      overflow: 'hidden',
    },
    cardsContainer: {
      flexDirection: 'row',
      width: cardWidth * cardCount,
    },
    card: {
      width: cardWidth,
    },
    indicatorsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
  });
}
