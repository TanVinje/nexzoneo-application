import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { CartProvider, useCart } from "./src/CartContext";
import SplashLoginScreen from "./src/screens/SplashLoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import SellerDetailScreen from "./src/screens/SellerDetailScreen";
import CartScreen from "./src/screens/CartScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OrderStatusScreen from "./src/screens/OrderStatusScreen";
import RatingScreen from "./src/screens/RatingScreen";
import LoadingSplash from "./src/components/LoadingSplash";
import EmptyState from "./src/components/EmptyState";
import ErrorState from "./src/components/ErrorState";
import { SkeletonBox } from "./src/components/Skeleton";
import { colors } from "./src/theme";
import { orderApi } from "./src/api";

export type RootStackParamList = {
  SplashLogin: undefined;
  Main: undefined;
  ProductDetail: { productId: string };
  SellerDetail: { companyId: string };
  OrderStatus: { orderId: string };
  Rating: { orderId: string; companyId: string; productIds: string[]; productNames?: string[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function CartTabIcon({ count }: { count: number }) {
  return (
    <View>
      <Text style={{ fontSize: 20 }}>🛒</Text>
      {count > 0 && (
        <View style={{
          position: "absolute", top: -4, right: -10,
          backgroundColor: colors.danger, borderRadius: 10,
          minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
        }}>
          <Text style={{ color: colors.white, fontSize: 11, fontWeight: "700" }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const { branding } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: branding.primary_color },
        headerTintColor: colors.white,
        tabBarActiveTintColor: branding.primary_color,
        tabBarInactiveTintColor: colors.mutedBlue,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text> }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Cart & Checkout",
          tabBarIcon: () => <CartTabIcon count={cartCount} />,
        }}
      />
      <Tab.Screen name="Orders" component={OrdersTab} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function OrdersTab({ navigation }: any) {
  const { branding } = useAuth();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    orderApi.my()
      .then((r) => setOrders(r.data))
      .catch(() => setError("Couldn't load your orders."))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.warmBeige, padding: 20 }}>
        <SkeletonBox height={80} style={{ marginBottom: 12 }} />
        <SkeletonBox height={80} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmBeige }}>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={branding.primary_color} />}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No orders yet"
            message="When you place an order, it will appear here."
            actionLabel="Browse Products"
            onAction={() => navigation.navigate("Home")}
          />
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={orderStyles.orderCard}
            onPress={() => navigation.getParent()?.navigate("OrderStatus", { orderId: item.id })}
          >
            <Text style={orderStyles.orderTitle}>Order #{item.id.slice(0, 8)}</Text>
            <Text style={[orderStyles.orderStatus, { color: branding.secondary_color }]}>{item.status}</Text>
            <Text style={orderStyles.orderPrice}>${Number(item.total_price).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const orderStyles = StyleSheet.create({
  orderCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  orderTitle: { fontWeight: "600", color: colors.deepNavy },
  orderStatus: { marginTop: 4 },
  orderPrice: { fontWeight: "700", marginTop: 8, fontSize: 16 },
});

function AppNavigator() {
  const { user, loading, branding } = useAuth();

  if (loading) {
    return (
      <LoadingSplash
        appName={branding.app_name}
        primaryColor={branding.primary_color}
        logoUrl={branding.logo_url}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: branding.primary_color }, headerTintColor: colors.white }}>
      {!user ? (
        <Stack.Screen name="SplashLogin" component={SplashLoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
          <Stack.Screen name="SellerDetail" component={SellerDetailScreen} options={{ title: "Seller" }} />
          <Stack.Screen name="OrderStatus" component={OrderStatusScreen} options={{ title: "Order Status" }} />
          <Stack.Screen name="Rating" component={RatingScreen} options={{ title: "Rate Your Order" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
