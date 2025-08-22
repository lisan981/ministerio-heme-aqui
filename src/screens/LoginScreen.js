import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import StorageService from '../services/StorageService';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [needsReactivation, setNeedsReactivation] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Estados del formulario
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCode, setRegCode] = useState('');

  // Código de activación
  const activationCode = '120217';
  const logoUrl = 'https://via.placeholder.com/150x150/6c9a75/ffffff?text=LOGO';

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const profile = await StorageService.getProfile();
      if (profile) {
        setProfileData(profile);
        setRegName(profile.name || '');
        setRegEmail(profile.email || '');
        
        if (!profile.configured) {
          setIsConfigured(false);
        } else {
          setIsConfigured(true);
          // Verificar si necesita reactivación (90 días)
          const activationDate = profile.activationDate ? new Date(profile.activationDate) : null;
          if (activationDate) {
            const expirationDate = new Date(activationDate);
            expirationDate.setDate(expirationDate.getDate() + 90);
            if (new Date() > expirationDate) {
              setNeedsReactivation(true);
            } else {
              // Usuario ya autenticado, navegar al dashboard
              navigateToDashboard();
            }
          } else {
            // Si no hay fecha de activación, forzar activación
            setIsConfigured(false);
          }
        }
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
    }
  };

  const navigateToDashboard = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      })
    );
  };

  const handleRegister = async () => {
    if (regCode !== activationCode) {
      Alert.alert('Error', 'Código de activación incorrecto. Por favor, inténtalo de nuevo.');
      return;
    }

    if (!regName.trim() || !regEmail.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        name: regName.trim(),
        email: regEmail.trim(),
        configured: true,
        activationDate: new Date().toISOString(),
        logoUrl: logoUrl,
        capitalInicial: 0,
        efectivo: 0,
      };

      await StorageService.saveProfile(profileData);
      
      Alert.alert(
        'Éxito',
        '¡Configuración guardada! Bienvenido a la aplicación.',
        [
          {
            text: 'OK',
            onPress: navigateToDashboard,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Error al guardar la configuración: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivation = async () => {
    if (regCode !== activationCode) {
      Alert.alert('Error', 'Código de activación incorrecto. Por favor, inténtalo de nuevo.');
      return;
    }

    setLoading(true);
    try {
      const updatedProfile = {
        ...profileData,
        activationDate: new Date().toISOString(),
      };

      await StorageService.saveProfile(updatedProfile);
      
      Alert.alert(
        'Éxito',
        'Aplicación reactivada con éxito.',
        [
          {
            text: 'OK',
            onPress: navigateToDashboard,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Error al reactivar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (needsReactivation) {
      handleReactivation();
    } else {
      handleRegister();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: logoUrl }} style={styles.logo} />
          <Title style={styles.title}>Ministerio Heme Aquí</Title>
          <Paragraph style={styles.subtitle}>PULPERIA COMUNITARIA BENIGNO</Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              {needsReactivation ? 'Reactivación Requerida' : 'Activación Requerida'}
            </Title>
            
            <Paragraph style={styles.description}>
              {needsReactivation
                ? 'Tu licencia de 3 meses ha expirado. Por favor, introduce el código de activación para continuar usando la app. Tus datos no se perderán.'
                : 'Para usar la aplicación, por favor, introduce el código de activación y tus datos.'
              }
            </Paragraph>

            {!needsReactivation && (
              <>
                <TextInput
                  label="Tu Nombre"
                  value={regName}
                  onChangeText={setRegName}
                  style={styles.input}
                  mode="outlined"
                  disabled={loading}
                />

                <TextInput
                  label="Tu Correo Electrónico"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  disabled={loading}
                />
              </>
            )}

            <TextInput
              label="Código de Activación"
              value={regCode}
              onChangeText={setRegCode}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              disabled={loading}
              loading={loading}
            >
              {loading 
                ? (needsReactivation ? 'Reactivando...' : 'Activando...') 
                : (needsReactivation ? 'Reactivar Aplicación' : 'Activar Aplicación')
              }
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9f3',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e3d31',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c9a75',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    elevation: 4,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2e3d31',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

export default LoginScreen;