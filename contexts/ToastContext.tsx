import React, { createContext, useContext, useCallback, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const ToastContext = createContext({ showToast: (msg: string, opts?: { body?: string; onPress?: () => void }) => {} });

export function useToast() {
  return useContext(ToastContext);
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<{ msg: string; body?: string; onPress?: () => void } | null>(null);
  const slide = React.useRef(new Animated.Value(-70)).current;

  const showToast = useCallback((msg: string, opts?: { body?: string; onPress?: () => void }) => {
    setToast({ msg, ...opts });
    setVisible(true);
    Animated.timing(slide, { toValue: 22, duration: 400, useNativeDriver: false }).start();
    setTimeout(() => {
      Animated.timing(slide, { toValue: -70, duration: 300, useNativeDriver: false }).start(() => {
        setVisible(false);
        setToast(null);
      });
    }, 2400);
  }, [slide]);

  const handleTap = () => {
    if (toast?.onPress) toast.onPress();
    Animated.timing(slide, { toValue: -70, duration: 200, useNativeDriver: false }).start(() => {
      setVisible(false);
      setToast(null);
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast overlay */}
      {visible && (
        <Animated.View style={[styles.toast, { top: slide }] }>
          <TouchableOpacity onPress={handleTap} activeOpacity={0.9}>
            <View style={styles.content}>
              <Text style={styles.title}>{toast?.msg}</Text>
              {!!toast?.body && (<Text style={styles.body}>{toast.body}</Text>)}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: 12, right: 12, zIndex: 10005,
    borderRadius: 20, backgroundColor: '#23272DDE',
    paddingHorizontal: 24, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 16, elevation: 13,
    alignItems: 'center',
    minHeight: 55,
    width: Dimensions.get('window').width - 24,
  },
  content: { alignItems: 'center' },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing:0.18 },
  body: { color:'#d9dff7', fontSize:14, marginTop:3,  letterSpacing:0.1 },
});
