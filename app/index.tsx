import { Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, View } from 'react-native'
import React, { useState } from 'react'
import { auth } from '../FirebaseConfig'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password)
      if (user) router.replace('/(tabs)');
    } catch (error: any) {
      console.log(error)
      alert('Inicio de sesión fallido: ' + error.message);
    }
  }

  return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo electrónico:</Text>
          <TextInput
              style={styles.textInput}
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña:</Text>
          <TextInput
              style={styles.textInput}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>¿Has olvidado tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={signIn}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/register')}
        >
          <Text style={styles.registerText}>Regístrate</Text>
        </TouchableOpacity>
      </SafeAreaView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    height: 50,
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#4285F4',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    width: '100%',
    height: 50,
    borderColor: '#4285F4',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  }
});