import { Image, StyleSheet, Text, View } from 'react-native';

export default function Header() {
  return (
    <View style={styles.container}>
      {/* Background Logo */}
      <Image
        source={require('@/assets/images/react-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* App Name */}
      <Text style={styles.title}>Hife</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    right: 16,          // move logo behind text area
    width: 40,
    height: 40,
    opacity: 1,       // makes it subtle behind text
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    zIndex: 1,          // ensures text stays above logo
  },
});
