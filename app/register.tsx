import { Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, View } from 'react-native'
import React, { useState } from 'react'
import { auth } from '../FirebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'

const RegisterScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const signUp = async () => {
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        try {
            const user = await createUserWithEmailAndPassword(auth, email, password)
            if (user) router.replace('/(tabs)');
        } catch (error: any) {
            console.log(error)
            alert('Registro fallido: ' + error.message);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para continuar</Text>

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
                    placeholder="Crea tu contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar contraseña:</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Confirma tu contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={signUp}>
                <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.back()}
            >
                <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

export default RegisterScreen

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
    registerButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#4285F4',
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
    loginButton: {
        width: '100%',
        height: 50,
        borderColor: '#4285F4',
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginText: {
        color: '#4285F4',
        fontSize: 16,
        fontWeight: 'bold',
    }
});