import requests
import sys
import json
from datetime import datetime

class ECommerceAPITester:
    def __init__(self, base_url="https://vendor-portal-214.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.regular_user = None
        self.test_product_id = None
        self.test_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@example.com", "password": "admin123"}
        )
        if success:
            self.admin_user = response
            print(f"   Admin logged in: {response.get('name')} ({response.get('role')})")
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "name": f"Test User {timestamp}",
                "email": test_email,
                "password": "testpass123"
            }
        )
        if success:
            self.regular_user = response
            print(f"   User registered: {response.get('name')}")
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_logout(self):
        """Test logout"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

    def test_products_list(self):
        """Test listing products"""
        success, response = self.run_test(
            "List Products",
            "GET",
            "products",
            200
        )
        if success:
            products = response.get('products', [])
            print(f"   Found {len(products)} products")
            if len(products) >= 6:
                print("✅ Expected 6+ seeded products found")
            else:
                print(f"⚠️  Expected 6+ products, found {len(products)}")
        return success

    def test_categories(self):
        """Test getting categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        if success:
            categories = response
            print(f"   Categories: {categories}")
        return success

    def test_create_product(self):
        """Test creating a product"""
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data={
                "name": "Test Product",
                "description": "A test product for API testing",
                "price": 19.99,
                "category": "Electronics",
                "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
                "stock": 10
            }
        )
        if success:
            self.test_product_id = response.get('id')
            print(f"   Created product ID: {self.test_product_id}")
        return success

    def test_get_product(self):
        """Test getting a specific product"""
        if not self.test_product_id:
            print("⚠️  Skipping get product test - no product ID")
            return True
        
        success, response = self.run_test(
            "Get Product by ID",
            "GET",
            f"products/{self.test_product_id}",
            200
        )
        return success

    def test_cart_operations(self):
        """Test cart operations"""
        # Get empty cart
        success, response = self.run_test(
            "Get Cart (Empty)",
            "GET",
            "cart",
            200
        )
        if not success:
            return False

        # Add item to cart
        if self.test_product_id:
            success, response = self.run_test(
                "Add to Cart",
                "POST",
                "cart/add",
                200,
                data={"product_id": self.test_product_id, "quantity": 2}
            )
            if not success:
                return False

            # Update cart item
            success, response = self.run_test(
                "Update Cart Item",
                "PUT",
                "cart/update",
                200,
                data={"product_id": self.test_product_id, "quantity": 3}
            )
            if not success:
                return False

            # Get cart with items
            success, response = self.run_test(
                "Get Cart (With Items)",
                "GET",
                "cart",
                200
            )
            if success:
                items = response.get('items', [])
                print(f"   Cart has {len(items)} items")

        return True

    def test_shipping_calculation(self):
        """Test shipping cost calculation"""
        success, response = self.run_test(
            "Calculate Shipping",
            "GET",
            "shipping/calculate",
            200
        )
        if success:
            print(f"   Shipping: {response}")
        return success

    def test_create_order(self):
        """Test creating an order"""
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data={
                "delivery_address": {
                    "name": "Test User",
                    "street": "123 Test St",
                    "city": "Test City",
                    "state": "Test State",
                    "zip_code": "12345",
                    "phone": "555-0123"
                }
            }
        )
        if success:
            self.test_order_id = response.get('id')
            print(f"   Created order ID: {self.test_order_id}")
        return success

    def test_list_orders(self):
        """Test listing user orders"""
        success, response = self.run_test(
            "List Orders",
            "GET",
            "orders",
            200
        )
        if success:
            orders = response
            print(f"   Found {len(orders)} orders")
        return success

    def test_admin_stats(self):
        """Test admin stats"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        if success:
            stats = response
            print(f"   Stats: Products={stats.get('total_products')}, Orders={stats.get('total_orders')}, Users={stats.get('total_users')}, Revenue=${stats.get('total_revenue')}")
        return success

    def test_admin_products(self):
        """Test admin product management"""
        success, response = self.run_test(
            "Admin List Products",
            "GET",
            "admin/products",
            200
        )
        return success

    def test_admin_orders(self):
        """Test admin order management"""
        success, response = self.run_test(
            "Admin List Orders",
            "GET",
            "admin/orders",
            200
        )
        return success

    def test_admin_users(self):
        """Test admin user management"""
        success, response = self.run_test(
            "Admin List Users",
            "GET",
            "admin/users",
            200
        )
        return success

def main():
    print("🚀 Starting E-Commerce API Tests")
    print("=" * 50)
    
    tester = ECommerceAPITester()
    
    # Test sequence
    tests = [
        # Auth tests
        ("Admin Login", tester.test_admin_login),
        ("Auth Me (Admin)", tester.test_auth_me),
        ("User Registration", tester.test_user_registration),
        ("Auth Me (User)", tester.test_auth_me),
        
        # Product tests
        ("List Products", tester.test_products_list),
        ("Get Categories", tester.test_categories),
        ("Create Product", tester.test_create_product),
        ("Get Product", tester.test_get_product),
        
        # Cart tests
        ("Cart Operations", tester.test_cart_operations),
        ("Shipping Calculation", tester.test_shipping_calculation),
        
        # Order tests
        ("Create Order", tester.test_create_order),
        ("List Orders", tester.test_list_orders),
        
        # Switch back to admin for admin tests
        ("Admin Login (Switch)", tester.test_admin_login),
        ("Admin Stats", tester.test_admin_stats),
        ("Admin Products", tester.test_admin_products),
        ("Admin Orders", tester.test_admin_orders),
        ("Admin Users", tester.test_admin_users),
        
        # Logout test
        ("Logout", tester.test_logout),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())