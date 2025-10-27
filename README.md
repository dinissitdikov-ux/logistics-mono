# Logistics Backend System

## Installation

```bash
docker pull ghcr.io/dinissitdikov-ux/logistics-mono:v0.0.4

A comprehensive monolithic backend API for logistics and supply chain management, built with Node.js, Express, and PostgreSQL.

## Features

### Core Modules
- **Authentication & Authorization** - JWT-based authentication with role-based access control
- **Order Management** - Create, track, and manage orders with multi-item support
- **Inventory Management** - Track stock levels across multiple warehouses
- **Fleet Management** - Manage vehicles and driver assignments
- **Delivery Tracking** - Real-time delivery status updates and tracking events
- **Warehouse Operations** - Multi-warehouse support with location-based inventory
- **Customer Management** - Customer profiles and order history
- **Product Catalog** - Product information with SKU management

### User Roles
- **Admin** - Full system access
- **Dispatcher** - Order and delivery management
- **Driver** - Delivery updates and tracking
- **Warehouse Manager** - Inventory and warehouse operations

## Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - Authentication and user profiles
- `warehouses` - Distribution centers and facilities
- `products` - Product catalog
- `inventory` - Stock levels per warehouse
- `customers` - Customer information
- `vehicles` - Fleet vehicles
- `orders` - Order management
- `order_items` - Order line items
- `deliveries` - Shipment tracking
- `routes` - Delivery routes
- `route_stops` - Route waypoints
- `tracking_events` - Delivery event logs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)

### Orders
- `GET /api/orders` - List all orders (with filtering)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

### Deliveries
- `GET /api/deliveries` - List all deliveries
- `GET /api/deliveries/:id` - Get delivery details with tracking
- `POST /api/deliveries` - Create delivery
- `PATCH /api/deliveries/:id/status` - Update delivery status
- `POST /api/deliveries/:id/tracking` - Add tracking event

### Inventory
- `GET /api/inventory` - Get inventory across warehouses
- `GET /api/inventory/check` - Check product availability
- `POST /api/inventory` - Update inventory levels

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Add new vehicle
- `PATCH /api/vehicles/:id` - Update vehicle

### Warehouses
- `GET /api/warehouses` - List all warehouses
- `GET /api/warehouses/:id` - Get warehouse details
- `POST /api/warehouses` - Create warehouse
- `PATCH /api/warehouses/:id` - Update warehouse

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer

## Getting Started

### Database Setup
```bash
npm run db:setup
```

### Start the Server
```bash
npm start
```

The API will be available at `http://localhost:5000`

### Development Mode
```bash
npm run dev
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register Example
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

## Example Workflows

### Creating an Order

1. **Create a customer** (if not exists)
2. **Create products** and add to inventory
3. **Create an order** with order items
4. **Create a delivery** for the order
5. **Update delivery status** as it progresses
6. **Add tracking events** for real-time updates

### Fleet Management

1. **Add vehicles** to the fleet
2. **Assign drivers** to vehicles
3. **Create routes** with multiple stops
4. **Track vehicle locations** in real-time
5. **Update vehicle status** (available, in_transit, maintenance)

## Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt
- **Validation**: express-validator

## Project Structure

```
logistics-backend/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── authController.js
│   ├── ordersController.js
│   ├── deliveriesController.js
│   ├── inventoryController.js
│   ├── vehiclesController.js
│   ├── warehousesController.js
│   ├── productsController.js
│   └── customersController.js
├── database/
│   └── setup.js             # Database schema
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js
│   ├── orders.js
│   ├── deliveries.js
│   ├── inventory.js
│   ├── vehicles.js
│   ├── warehouses.js
│   ├── products.js
│   └── customers.js
├── server.js                # Main server file
└── package.json
```

## Environment Variables

The following environment variables are available:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
  
## License

ISC
CI: push test
