# Logistics Backend System

## Overview
This is a comprehensive monolithic backend API for logistics and supply chain management. Built with Node.js, Express, and PostgreSQL, it provides complete functionality for managing orders, deliveries, inventory, fleet operations, and warehouse management.

## Project Purpose
Provide a robust, production-ready backend API for logistics companies to:
- Manage orders from creation to delivery
- Track inventory across multiple warehouses
- Monitor fleet vehicles and driver assignments
- Track deliveries in real-time with detailed event logging
- Manage customer relationships and order history

## Current State
- ✅ Database schema fully implemented (12 tables)
- ✅ All core API endpoints implemented
- ✅ JWT authentication with role-based access control
- ✅ Server running on port 5000
- ✅ PostgreSQL database configured and initialized

## Recent Changes
*2025-10-23*
- Initial project setup
- Created database schema with 12 interconnected tables
- Implemented 8 controller modules (auth, orders, deliveries, inventory, vehicles, warehouses, products, customers)
- Created RESTful API routes for all modules
- Added JWT-based authentication and role-based authorization
- Configured Express server with security middleware (helmet, cors)
- Database initialized and server running successfully

## User Preferences
- Monolithic architecture (single backend service)
- PostgreSQL for data persistence
- RESTful API design
- JWT for authentication

## Project Architecture

### Database Schema
The system uses PostgreSQL with the following key entities:
1. **Users** - Authentication and role management
2. **Warehouses** - Distribution centers with geolocation
3. **Products** - Product catalog with SKU tracking
4. **Inventory** - Stock management per warehouse
5. **Customers** - Customer profiles and contact info
6. **Vehicles** - Fleet management with capacity tracking
7. **Orders** - Order management with status tracking
8. **Order Items** - Line items for each order
9. **Deliveries** - Shipment tracking and assignment
10. **Routes** - Delivery route planning
11. **Route Stops** - Waypoints for each route
12. **Tracking Events** - Detailed delivery event logs

### Key Features
- Role-based access control (admin, dispatcher, driver, warehouse_manager)
- Transaction support for order creation (atomic operations)
- Inventory reservation system to prevent overselling
- Real-time delivery tracking with event logs
- Multi-warehouse inventory management
- Fleet vehicle tracking and assignment

### API Structure
```
/api/auth          - Authentication (register, login, profile)
/api/orders        - Order management
/api/deliveries    - Delivery tracking
/api/inventory     - Inventory operations
/api/vehicles      - Fleet management
/api/warehouses    - Warehouse operations
/api/products      - Product catalog
/api/customers     - Customer management
```

### Security
- Password hashing with bcrypt
- JWT tokens with 7-day expiration
- Helmet.js for HTTP security headers
- CORS enabled for cross-origin requests
- Role-based endpoint authorization

## Technical Decisions
1. **Monolithic Architecture** - Chose single backend service for simplicity and ease of deployment
2. **PostgreSQL** - Selected for ACID compliance, relational data modeling, and complex queries
3. **JWT Authentication** - Stateless authentication for scalability
4. **Express.js** - Industry-standard, lightweight web framework
5. **Transaction Support** - Implemented for order creation to ensure data consistency

## How to Use

### First Time Setup
1. Run `npm run db:setup` to initialize the database schema
2. Run `npm start` to start the server

### Creating Your First User
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

### Testing the API
- Health check: `GET /health`
- API documentation: `GET /`
- All other endpoints require authentication (JWT token in Authorization header)

## Dependencies
- express - Web framework
- pg - PostgreSQL client
- jsonwebtoken - JWT authentication
- bcrypt - Password hashing
- helmet - Security headers
- cors - Cross-origin resource sharing
- express-validator - Input validation
- dotenv - Environment variables

## Environment
- Node.js 20
- PostgreSQL (Neon-backed Replit database)
- Port 5000
