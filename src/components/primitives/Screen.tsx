import { ScrollView, View, StyleSheet } from 'react-native';
import {colors} from "@/theme";

interface ScreenProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  backgroundColor?: string;
  scrollable?: boolean;
}

export function Screen({ children, padding = 'md', scrollable = true, backgroundColor = colors.background }: ScreenProps) {
  if (!scrollable) {
    return (
      <View style={[styles.container, styles[padding], backgroundColor ]}>
        {children}
      </View>
    );
  }

  return (
      <ScrollView style={[styles.scroll, { backgroundColor }]} contentContainerStyle={[styles.content, styles[padding]]}>
        {children}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  none: {},
  sm: {},
  md: {},
  lg: {},
});
