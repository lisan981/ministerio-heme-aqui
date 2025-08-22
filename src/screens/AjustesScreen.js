import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  List,
  Divider,
  Switch,
  Avatar,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const AjustesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [quarterlyReports, setQuarterlyReports] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [profile, reportes] = await Promise.all([
        StorageService.getProfile(),
        StorageService.getReportes(),
      ]);

      setProfileData(profile);
      setQuarterlyReports(reportes);
      setLogoUrl(profile?.logoUrl);
    } catch (error) {
      console.error('Error loading settings data:', error);
      Alert.alert('Error', 'Error al cargar los datos de configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        try {
          const base64String = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
          
          const updatedProfile = {
            ...profileData,
            logoUrl: base64String
          };
          
          await StorageService.saveProfile(updatedProfile);
          setLogoUrl(base64String);
          Alert.alert('Éxito', 'Logo actualizado con éxito');
        } catch (error) {
          Alert.alert('Error', 'Error al actualizar el logo');
        }
      }
    });
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const allData = await StorageService.exportData();
      
      const dataString = JSON.stringify(allData, null, 2);
      
      await Share.share({
        message: dataString,
        title: 'Backup de Datos - Pulpería Comunitaria',
      });
    } catch (error) {
      Alert.alert('Error', 'Error al exportar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageService.clearAllData();
              Alert.alert(
                'Datos eliminados',
                'Todos los datos han sido eliminados. La app se reiniciará.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Reiniciar la navegación
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar los datos');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const getActivationStatus = () => {
    if (!profileData?.activationDate) return 'No activado';
    
    const activationDate = new Date(profileData.activationDate);
    const expirationDate = new Date(activationDate);
    expirationDate.setDate(expirationDate.getDate() + 90);
    const daysLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return 'Expirado';
    if (daysLeft <= 7) return `Expira en ${daysLeft} días`;
    return `Activo (${daysLeft} días restantes)`;
  };

  const getStatusColor = () => {
    if (!profileData?.activationDate) return '#F44336';
    
    const activationDate = new Date(profileData.activationDate);
    const expirationDate = new Date(activationDate);
    expirationDate.setDate(expirationDate.getDate() + 90);
    const daysLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return '#F44336';
    if (daysLeft <= 7) return '#FF9800';
    return '#4CAF50';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Información del usuario */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Image
                size={80}
                source={{ uri: logoUrl || 'https://via.placeholder.com/150x150/6c9a75/ffffff?text=LOGO' }}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Title style={styles.profileName}>
                  {profileData?.name || 'Usuario'}
                </Title>
                <Text style={styles.profileEmail}>
                  {profileData?.email || 'No disponible'}
                </Text>
                <Text style={[styles.activationStatus, { color: getStatusColor() }]}>
                  {getActivationStatus()}
                </Text>
              </View>
            </View>
            
            <Button
              mode="outlined"
              onPress={handleLogoUpload}
              style={styles.changeLogoButton}
              icon="camera"
            >
              Cambiar Logo
            </Button>
          </Card.Content>
        </Card>

        {/* Opciones de la aplicación */}
        <Card style={styles.optionsCard}>
          <Card.Content>
            <Title>Opciones de la Aplicación</Title>
          </Card.Content>
          
          <List.Item
            title="Exportar Datos"
            description="Crear backup de todos los datos"
            left={props => <List.Icon {...props} icon="download" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleExportData}
          />
          
          <Divider />
          
          <List.Item
            title="Reportes Trimestrales"
            description={`${quarterlyReports.length} reportes guardados`}
            left={props => <List.Icon {...props} icon="assessment" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              if (quarterlyReports.length === 0) {
                Alert.alert('Info', 'No hay reportes trimestrales guardados');
              } else {
                Alert.alert('Reportes', `Tienes ${quarterlyReports.length} reportes guardados`);
              }
            }}
          />
          
          <Divider />
          
          <List.Item
            title="Información de la App"
            description="Versión 1.0.0"
            left={props => <List.Icon {...props} icon="info" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert(
                'Información de la App',
                'Pulpería Comunitaria v1.0.0\nMinisterio Heme Aquí\n\nDesarrollado para la gestión completa de pulperías comunitarias con almacenamiento local seguro.'
              );
            }}
          />
        </Card>

        {/* Estadísticas de uso */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>Estadísticas de Uso</Title>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fecha de activación:</Text>
              <Text style={styles.statValue}>
                {profileData?.activationDate 
                  ? new Date(profileData.activationDate).toLocaleDateString()
                  : 'No disponible'
                }
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Días de uso:</Text>
              <Text style={styles.statValue}>
                {profileData?.activationDate 
                  ? Math.floor((new Date() - new Date(profileData.activationDate)) / (1000 * 60 * 60 * 24))
                  : 0
                }
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Acciones peligrosas */}
        <Card style={styles.dangerCard}>
          <Card.Content>
            <Title style={styles.dangerTitle}>Zona Peligrosa</Title>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              Cerrar Sesión
            </Button>
            
            <Button
              mode="contained"
              onPress={handleClearAllData}
              style={styles.deleteButton}
              icon="delete-forever"
              loading={loading}
              disabled={loading}
            >
              Eliminar Todos los Datos
            </Button>
          </Card.Content>
        </Card>

        {/* Información adicional */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title>Acerca de</Title>
            <Text style={styles.infoText}>
              Esta aplicación ha sido desarrollada para facilitar la gestión de pulperías comunitarias.
              Todos los datos se almacenan localmente en tu dispositivo para garantizar la privacidad y seguridad.
            </Text>
            <Text style={styles.infoText}>
              Desarrollado por: Ministerio Heme Aquí
            </Text>
            <Text style={styles.infoText}>
              Versión: 1.0.0
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9f3',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activationStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  changeLogoButton: {
    marginTop: 8,
  },
  optionsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  dangerCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    backgroundColor: '#ffebee',
  },
  dangerTitle: {
    color: '#F44336',
    marginBottom: 16,
  },
  logoutButton: {
    marginBottom: 12,
    borderColor: '#F44336',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default AjustesScreen;