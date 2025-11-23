#!/bin/bash

# Script to combine all migration files into one for easy execution
# Usage: ./combine-migrations.sh > all-migrations.sql

echo "-- Combined Migration File for Ad-Genie"
echo "-- Run this file in Supabase SQL Editor"
echo "-- Generated on: $(date)"
echo ""
echo "-- =========================================="
echo "-- Migration 001: Users Table"
echo "-- =========================================="
cat supabase/migrations/001_create_users_table.sql

echo ""
echo "-- =========================================="
echo "-- Migration 002: Brands Table"
echo "-- =========================================="
cat supabase/migrations/002_create_brands_table.sql

echo ""
echo "-- =========================================="
echo "-- Migration 003: Product Images Table"
echo "-- =========================================="
cat supabase/migrations/003_create_product_images_table.sql

echo ""
echo "-- =========================================="
echo "-- Migration 004: Seasonal Suggestions Table"
echo "-- =========================================="
cat supabase/migrations/004_create_seasonal_suggestions_table.sql

echo ""
echo "-- =========================================="
echo "-- Migration 005: User Preferences Table"
echo "-- =========================================="
cat supabase/migrations/005_create_user_preferences_table.sql

echo ""
echo "-- =========================================="
echo "-- Migration 006: Landing Page Submissions Table"
echo "-- =========================================="
cat supabase/migrations/006_create_landing_page_submissions_table.sql

echo ""
echo "-- =========================================="
echo "-- Migration Complete!"
echo "-- Next steps:"
echo "-- 1. Create storage buckets: logos and product-images"
echo "-- 2. Set up storage policies (see MIGRATION_GUIDE.md)"
echo "-- =========================================="



