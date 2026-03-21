import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E8FF47',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    padding: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 14,
  },
  button: {
    width: '100%',
    backgroundColor: '#E8FF47',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#aaa',
    fontSize: 14,
  },
  linkBold: {
    color: '#E8FF47',
    fontWeight: 'bold',
  },
});
