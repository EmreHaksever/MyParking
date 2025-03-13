import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserParkingLocations, deleteParkingLocation } from '../services/parkingService';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function SavedLocationsScreen() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const savedLocations = await getUserParkingLocations();
      setLocations(savedLocations);
      applyFilters(savedLocations, searchQuery, activeFilter, sortBy);
    } catch (error) {
      Alert.alert('Hata', 'Kayıtlı konumlar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLocations();
    }, [])
  );

  const applyFilters = (data, query, filter, sort) => {
    // Önce arama sorgusuna göre filtrele
    let result = data;
    
    if (query) {
      result = result.filter(item => 
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Sonra park tipine göre filtrele
    if (filter === 'free') {
      result = result.filter(item => !item.isPaid);
    } else if (filter === 'paid') {
      result = result.filter(item => item.isPaid);
    }
    
    // Son olarak sıralama uygula
    if (sort === 'newest') {
      result = [...result].sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === 'oldest') {
      result = [...result].sort((a, b) => a.createdAt - b.createdAt);
    } else if (sort === 'alphabetical') {
      result = [...result].sort((a, b) => a.description.localeCompare(b.description));
    }
    
    setFilteredLocations(result);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(locations, text, activeFilter, sortBy);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(locations, searchQuery, filter, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    applyFilters(locations, searchQuery, activeFilter, sort);
  };

  const handleDelete = (locationId) => {
    Alert.alert(
      'Konumu Sil',
      'Bu konumu silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParkingLocation(locationId);
              await loadLocations();
              Alert.alert('Başarılı', 'Konum başarıyla silindi');
            } catch (error) {
              Alert.alert('Hata', 'Konum silinirken bir hata oluştu');
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
      Alert.alert('Hata', 'Harita uygulaması açılamadı');
    });
  };

  const renderItem = ({ item }) => {
    const calculateRemainingMinutes = (createdAt, freeMinutes) => {
      if (!freeMinutes) return 0;
      const currentTime = Date.now();
      const elapsedMinutes = Math.floor((currentTime - createdAt) / (1000 * 60));
      return Math.max(0, freeMinutes - elapsedMinutes);
    };

    const remainingMinutes = calculateRemainingMinutes(item.createdAt, item.freeMinutes);
    const formattedDate = new Date(item.createdAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={[styles.locationItem, isDarkMode && styles.darkLocationItem]}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitleContainer}>
            <View style={[
              styles.parkingTypeIndicator, 
              item.isPaid ? styles.paidIndicator : styles.freeIndicator
            ]} />
            <Text style={[styles.locationDescription, isDarkMode && styles.darkText]}>
              {item.description}
            </Text>
          </View>
          <Text style={[styles.timestamp, isDarkMode && styles.darkSecondaryText]}>
            {formattedDate}
          </Text>
        </View>
        
        <View style={styles.locationContent}>
          <View style={styles.locationInfo}>
            <View style={styles.infoRow}>
              <Ionicons 
                name={item.isPaid ? "card-outline" : "cash-outline"} 
                size={16} 
                color={isDarkMode ? COLORS.white : COLORS.text.primary} 
                style={styles.infoIcon}
              />
              <Text style={[styles.parkingType, isDarkMode && styles.darkSecondaryText]}>
                {item.isPaid ? 'Ücretli Park' : 'Ücretsiz Park'}
              </Text>
            </View>
            
            {item.isPaid && (
              <View style={styles.infoRow}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={remainingMinutes > 0 ? COLORS.primary : COLORS.error} 
                  style={styles.infoIcon}
                />
                <Text style={[
                  styles.freeMinutes, 
                  remainingMinutes > 0 ? styles.activeTime : styles.expiredTime
                ]}>
                  {remainingMinutes > 0 
                    ? `${remainingMinutes} dakika ücretsiz park süresi kaldı`
                    : 'Ücretsiz park süresi doldu'}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={isDarkMode ? COLORS.white : COLORS.text.primary} 
                style={styles.infoIcon}
              />
              <Text style={[styles.locationDetails, isDarkMode && styles.darkSecondaryText]}>
                {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.navigateButton]}
              onPress={() => openMapsNavigation(item.latitude, item.longitude, item.description)}
            >
              <Ionicons name="navigate" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Yol Tarifi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Sil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSortOptions = () => (
    <View style={[styles.sortOptionsContainer, isDarkMode && styles.darkSortOptionsContainer]}>
      <Text style={[styles.sortLabel, isDarkMode && styles.darkText]}>Sırala:</Text>
      <TouchableOpacity 
        style={[styles.sortOption, sortBy === 'newest' && styles.activeSortOption]}
        onPress={() => handleSortChange('newest')}
      >
        <Text style={[
          styles.sortOptionText, 
          sortBy === 'newest' ? styles.activeSortOptionText : isDarkMode && styles.darkSecondaryText
        ]}>
          En Yeni
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.sortOption, sortBy === 'oldest' && styles.activeSortOption]}
        onPress={() => handleSortChange('oldest')}
      >
        <Text style={[
          styles.sortOptionText, 
          sortBy === 'oldest' ? styles.activeSortOptionText : isDarkMode && styles.darkSecondaryText
        ]}>
          En Eski
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.sortOption, sortBy === 'alphabetical' && styles.activeSortOption]}
        onPress={() => handleSortChange('alphabetical')}
      >
        <Text style={[
          styles.sortOptionText, 
          sortBy === 'alphabetical' ? styles.activeSortOptionText : isDarkMode && styles.darkSecondaryText
        ]}>
          A-Z
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Kayıtlı Konumlar</Text>
      </View>

      {/* Arama Çubuğu */}
      <View style={[styles.searchContainer, isDarkMode && styles.darkSearchContainer]}>
        <Ionicons name="search" size={20} color={isDarkMode ? COLORS.white : COLORS.text.secondary} />
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.darkText]}
          placeholder="Konum ara..."
          placeholderTextColor={isDarkMode ? '#a0a0a0' : COLORS.text.secondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={isDarkMode ? COLORS.white : COLORS.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtre Butonları */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeFilter === 'all' && styles.filterButtonActive,
            isDarkMode && activeFilter !== 'all' && styles.darkFilterButton,
            isDarkMode && activeFilter === 'all' && styles.darkFilterButtonActive
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[
            styles.filterText, 
            activeFilter === 'all' && styles.filterTextActive,
            isDarkMode && activeFilter !== 'all' && styles.darkSecondaryText,
            isDarkMode && activeFilter === 'all' && styles.darkText
          ]}>
            Tümü
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeFilter === 'free' && styles.filterButtonActive,
            isDarkMode && activeFilter !== 'free' && styles.darkFilterButton,
            isDarkMode && activeFilter === 'free' && styles.darkFilterButtonActive
          ]}
          onPress={() => handleFilterChange('free')}
        >
          <Text style={[
            styles.filterText, 
            activeFilter === 'free' && styles.filterTextActive,
            isDarkMode && activeFilter !== 'free' && styles.darkSecondaryText,
            isDarkMode && activeFilter === 'free' && styles.darkText
          ]}>
            Ücretsiz
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeFilter === 'paid' && styles.filterButtonActive,
            isDarkMode && activeFilter !== 'paid' && styles.darkFilterButton,
            isDarkMode && activeFilter === 'paid' && styles.darkFilterButtonActive
          ]}
          onPress={() => handleFilterChange('paid')}
        >
          <Text style={[
            styles.filterText, 
            activeFilter === 'paid' && styles.filterTextActive,
            isDarkMode && activeFilter !== 'paid' && styles.darkSecondaryText,
            isDarkMode && activeFilter === 'paid' && styles.darkText
          ]}>
            Ücretli
          </Text>
        </TouchableOpacity>
      </View>

      {renderSortOptions()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="location-outline" 
                size={60} 
                color={isDarkMode ? '#3a3a3a' : '#e0e0e0'} 
              />
              <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
                {searchQuery 
                  ? 'Aramanızla eşleşen konum bulunamadı' 
                  : 'Henüz kayıtlı konum yok'}
              </Text>
              <Text style={[styles.emptySubText, isDarkMode && styles.darkSecondaryText]}>
                {searchQuery 
                  ? 'Farklı bir arama terimi deneyin veya filtreleri temizleyin' 
                  : 'Ana sayfadan yeni bir konum ekleyebilirsiniz'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
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
  darkHeader: {
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  darkText: {
    color: COLORS.white,
  },
  darkSecondaryText: {
    color: '#a0a0a0',
  },
  // Arama Çubuğu Stilleri
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.medium,
    marginVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkSearchContainer: {
    backgroundColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.small,
    height: 40,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.regular,
  },
  // Filtre Butonları Stilleri
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.small,
  },
  filterButton: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: 20,
    marginRight: SPACING.small,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.shadow,
  },
  darkFilterButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  darkFilterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
  // Sıralama Seçenekleri Stilleri
  sortOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.medium,
    padding: SPACING.small,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  darkSortOptionsContainer: {
    backgroundColor: '#2a2a2a',
  },
  sortLabel: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    marginRight: SPACING.small,
  },
  sortOption: {
    paddingHorizontal: SPACING.small,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.small,
  },
  activeSortOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sortOptionText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
  },
  activeSortOptionText: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  // Liste Stilleri
  listContent: {
    padding: SPACING.medium,
    paddingBottom: SPACING.xlarge * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xlarge,
    marginTop: SPACING.xlarge,
  },
  emptyText: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginTop: SPACING.medium,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    marginTop: SPACING.small,
    textAlign: 'center',
  },
  // Konum Öğesi Stilleri
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
    overflow: 'hidden',
  },
  darkLocationItem: {
    backgroundColor: '#2a2a2a',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    padding: SPACING.medium,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parkingTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.small,
  },
  freeIndicator: {
    backgroundColor: COLORS.success,
  },
  paidIndicator: {
    backgroundColor: COLORS.primary,
  },
  locationDescription: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    flex: 1,
  },
  timestamp: {
    fontSize: FONTS.sizes.xsmall,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  locationContent: {
    padding: SPACING.medium,
  },
  locationInfo: {
    marginBottom: SPACING.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small / 2,
  },
  infoIcon: {
    marginRight: SPACING.small / 2,
  },
  parkingType: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
  },
  freeMinutes: {
    fontSize: FONTS.sizes.small,
    fontWeight: FONTS.weights.medium,
  },
  activeTime: {
    color: COLORS.primary,
  },
  expiredTime: {
    color: COLORS.error,
  },
  locationDetails: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: SPACING.small / 2,
  },
  navigateButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.small / 2,
  },
  expired: {
    color: COLORS.error,
  },
}); 