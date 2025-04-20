import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Modal,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define tree-themed colors to match the rest of the app
const COLORS = {
  primary: '#FF7757', // Coral/orange for primary elements
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements
  white: '#FFFFFF',
};

interface Item {
  id: string;
  name: string;
  description: string;
  price: string;
  image: ImageSourcePropType;
  category?: string;
}

interface EcoStoreModalProps {
  visible: boolean;
  onClose: () => void;
  userPoints: number;
}

const EcoStoreModal = ({ visible, onClose, userPoints }: EcoStoreModalProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Example function to handle redeeming items
  const handleRedeem = (item: Item) => {
    console.log('Redeeming item:', item);
    // Implement redemption logic here
    alert(`Item "${item.name}" redeemed for ${item.price} points!`);
    setSelectedItem(null);
  };

  // Featured items data
  const featuredItems: Item[] = [
    {
      id: '1',
      name: 'Eco-Friendly Backpack',
      description: 'Made from recycled materials',
      price: '500',
      image: require('../../assets/images/backpack.png')
    },
    {
      id: '2',
      name: 'Solar Charger',
      description: 'Charge your devices with solar power',
      price: '750',
      image: require('../../assets/images/solar-charger.png')
    },
    {
      id: '3',
      name: 'Bamboo Water Bottle',
      description: 'Sustainable and durable',
      price: '300',
      image: require('../../assets/images/bamboo-bottle.png')
    }
  ];

  // Categories data
  const categories = [
    { name: 'Apparel', icon: 'shirt', color: '#4CAF50' },
    { name: 'Vouchers', icon: 'gift', color: '#2196F3' },
    { name: 'Accessories', icon: 'watch', color: '#9C27B0' }
  ];

  // Products data
  const products: Item[] = [
    {
      id: '4',
      name: 'Organic Cotton T-Shirt',
      description: '100% organic cotton, fair trade',
      price: '400',
      image: require('../../assets/images/tshirt.png'),
      category: 'Apparel'
    },
    {
      id: '5',
      name: 'Local Cafe Voucher',
      description: '20% off at Green Bean Cafe',
      price: '200',
      image: require('../../assets/images/voucher.png'),
      category: 'Vouchers'
    },
    {
      id: '6',
      name: 'Recycled Glass Water Bottle',
      description: 'Made from 100% recycled glass',
      price: '450',
      image: require('../../assets/images/bamboo-bottle.png'),
      category: 'Accessories'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.merchandiseContainer}>
        {/* Header */}
        <SafeAreaView style={styles.merchandiseHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.merchandiseHeaderTitle}>Eco Store</Text>
          <View style={styles.coinBalance}>
            <Ionicons name="leaf" size={20} color="#FFF" />
            <Text style={styles.coinBalanceText}>{userPoints}</Text>
          </View>
        </SafeAreaView>

        <ScrollView style={styles.merchandiseContent}>
          {/* Featured Items */}
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured Items</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.featuredItem}
                  onPress={() => setSelectedItem(item)}
                >
                  <Image source={item.image} style={styles.featuredImage} />
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{item.name}</Text>
                    <Text style={styles.featuredDescription}>{item.description}</Text>
                    <View style={styles.featuredPrice}>
                      <Ionicons name="leaf" size={16} color={COLORS.leafGreen} />
                      <Text style={styles.priceText}>{item.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={styles.categoryItem}
                  onPress={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                    <Ionicons name={category.icon as any} size={24} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Product List */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>{selectedCategory || 'All Products'}</Text>
            <View style={styles.productsGrid}>
              {products
                .filter(item => !selectedCategory || item.category === selectedCategory)
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.productItem}
                    onPress={() => setSelectedItem(item)}
                  >
                    <Image source={item.image} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productDescription}>{item.description}</Text>
                      <View style={styles.productPrice}>
                        <Ionicons name="leaf" size={16} color={COLORS.leafGreen} />
                        <Text style={styles.priceText}>{item.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Product Detail Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                <Image source={selectedItem.image} style={styles.detailImage} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailName}>{selectedItem.name}</Text>
                  <Text style={styles.detailDescription}>{selectedItem.description}</Text>
                  <View style={styles.detailPrice}>
                    <Ionicons name="leaf" size={24} color={COLORS.leafGreen} />
                    <Text style={styles.detailPriceText}>{selectedItem.price}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      parseInt(selectedItem.price) > userPoints ? styles.disabledButton : {}
                    ]}
                    onPress={() => handleRedeem(selectedItem)}
                    disabled={parseInt(selectedItem.price) > userPoints}
                  >
                    <Text style={styles.redeemButtonText}>
                      {parseInt(selectedItem.price) > userPoints ? 'Not Enough Points' : 'Redeem'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  merchandiseContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  merchandiseHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  merchandiseHeaderTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  coinBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinBalanceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  merchandiseContent: {
    flex: 1,
    padding: 20,
  },
  featuredSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  featuredItem: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  featuredPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.leafGreen,
    marginLeft: 4,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: '30%',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  productsSection: {
    marginBottom: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  productItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  productPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  detailImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  detailInfo: {
    padding: 20,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 16,
    lineHeight: 24,
  },
  detailPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailPriceText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.leafGreen,
    marginLeft: 8,
  },
  redeemButton: {
    backgroundColor: COLORS.leafGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
  },
  redeemButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EcoStoreModal;