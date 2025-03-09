import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  Alert,
  TouchableOpacity,
  Linking,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserParkingLocations, deleteParkingLocation } from '../services/parkingService';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useFocusEffect } from '@react-navigation/native';

export default function SavedLocationsScreen() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const savedLocations = await getUserParkingLocations();
      setLocations(savedLocations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load saved locations');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadLocations();
    }, [])
  );

  const handleDelete = (locationId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParkingLocation(locationId);
              await loadLocations(); // Reload the list
              Alert.alert('Success', 'Location deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete location');
            }
          }
        }
      ]
    );
  };

  const openMapsNavigation = (latitude, longitude, description) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q='
    });
    const latLng = `${latitude},${longitude}`;
    const label = description;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.locationItem}>
      <TouchableOpacity 
        style={styles.locationContent}
        onPress={() => openMapsNavigation(item.latitude, item.longitude, item.description)}
      >
        <View style={styles.locationInfo}>
          <Text style={styles.locationDescription}>{item.description}</Text>
          <Text style={styles.locationDetails}>
            Lat: {item.latitude.toFixed(6)}, Long: {item.longitude.toFixed(6)}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={styles.locationActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openMapsNavigation(item.latitude, item.longitude, item.description)}
          >
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
      </View>

      <FlatList
        data={locations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && (
            <Text style={styles.emptyText}>
              No saved locations yet
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.large,
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  listContent: {
    padding: SPACING.medium,
  },
  locationItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.large,
  },
  locationInfo: {
    flex: 1,
    marginRight: SPACING.medium,
  },
  locationDescription: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  locationDetails: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    marginBottom: SPACING.small,
  },
  timestamp: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  locationActions: {
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: SPACING.small,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.secondary,
    marginTop: SPACING.xlarge,
  },
}); 