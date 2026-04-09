# PastelShop E-Commerce Platform - PRD

## Original Problem Statement
Build an e-commerce platform with login/auth and dashboard for managing listed items for sale. Pay on delivery option with local courier tax. Admin management dashboards for items/orders/accounts.

## User Personas
- **Buyer**: Browses products, adds to cart, places orders with pay-on-delivery
- **Seller**: Lists and manages their products via dashboard
- **Admin**: Full management of all products, orders, and user accounts

## Core Requirements
- JWT-based authentication (email/password)
- General product listings with search & category filters
- Shopping cart with quantity management
- Checkout with pay-on-delivery + courier tax (2.5%) + delivery fee tiers
- Personal dashboard for product CRUD
- Admin panel for managing all items, orders, and user accounts
- Cute pastel design (Nunito/DM Sans fonts, peach/lavender/mint accents)

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion
- **Auth**: JWT tokens in httpOnly cookies (access: 15min, refresh: 7 days)
- **Database**: MongoDB with indexed collections (users, products, carts, orders)

## What's Been Implemented (April 9, 2026)
- Full JWT auth (register, login, logout, refresh, brute-force protection)
- Product CRUD with seller ownership
- Cart management (add, update, remove)
- Checkout with pay-on-delivery + courier tax calculation
- Order placement and history
- Admin panel with stats, products table, orders management, users management
- Admin can update order status, toggle user roles, delete users
- Pastel design system with Nunito/DM Sans fonts
- 6 seeded sample products, admin user seeded on startup
- **Product Detail Page** at /product/:id with full description, quantity selector, add-to-cart
- **Image Upload** via Emergent object storage - drag-and-drop + URL fallback in product form

## Backlog
- P0: None (all core features implemented)
- P1: Order email notifications, seller dashboard analytics
- P2: Wishlist, product reviews/ratings, inventory alerts
- P3: Multiple payment methods, discount codes, referral system

## Next Tasks
1. Add product detail page with full description view
2. Add image upload for products (object storage integration)
3. Add email notifications for order confirmations
4. Add seller dashboard analytics (sales, views, revenue)
