import { createContext, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [config, setConfig] = useState(null);

  function show(title, message, buttons) {
    setConfig({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
    });
  }

  function handlePress(btn) {
    setConfig(null);
    btn.onPress?.();
  }

  return (
    <ModalContext.Provider value={{ show }}>
      {children}
      <Modal visible={!!config} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{config?.title}</Text>
            {!!config?.message && (
              <Text style={styles.message}>{config.message}</Text>
            )}
            <View style={styles.divider} />
            <View style={[styles.buttonsRow, config?.buttons?.length === 1 && styles.singleButton]}>
              {config?.buttons?.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    config.buttons.length > 1 && styles.btnFlex,
                    btn.style === 'cancel' && styles.btnCancel,
                    btn.style === 'destructive' && styles.btnDestructive,
                    (!btn.style || btn.style === 'default') && styles.btnPrimary,
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      btn.style === 'cancel' && styles.btnTextCancel,
                      btn.style === 'destructive' && styles.btnTextDestructive,
                      (!btn.style || btn.style === 'default') && styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  message: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  singleButton: {
    flexDirection: 'column',
  },
  btn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFlex: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: '#2a2a2a',
  },
  btnPrimary: {
    backgroundColor: '#E8FF47',
  },
  btnCancel: {
    backgroundColor: '#2a2a2a',
  },
  btnDestructive: {
    backgroundColor: '#2a2a2a',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: '#121212',
  },
  btnTextCancel: {
    color: '#aaa',
  },
  btnTextDestructive: {
    color: '#ff5555',
  },
});
