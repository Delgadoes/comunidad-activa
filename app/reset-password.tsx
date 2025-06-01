import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../FirebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { router } from 'expo-router';

const ResetPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                'Correo enviado',
                `Se ha enviado un enlace para restablecer tu contraseña a ${email}.\n\nRevisa tu bandeja de entrada.`
            );
            router.back(); // Regresa a la pantalla anterior después del éxito
        } catch (error: any) {
            console.error('Error al enviar correo:', error);
            let errorMessage = 'Error al enviar correo de recuperación';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No existe una cuenta con este correo electrónico';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Correo electrónico inválido';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.subtitle}>
                Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
            />

            <TouchableOpacity
                style={[styles.button, isLoading && styles.disabledButton]}
                onPress={handleResetPassword}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? 'Enviando...' : 'Enviar enlace'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backButtonText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#000000',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
        color: '#666666',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#F5F5F5',
    },
    button: {
        backgroundColor: '#4285F4',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButton: {
        padding: 15,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
});

export default ResetPasswordScreen;