-- ============================================================
-- GOOGLE REVIEW QR AUTOMATION SAAS - DATABASE SCHEMA & RLS
-- PostgreSQL / Supabase Schema with Row Level Security (RLS)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Users linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'CLIENT' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'CLIENT', 'STAFF')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESSES (Isolated Business entity)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    website TEXT,
    logo_url TEXT,
    google_review_url TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESS_MEMBERS (Team members and authorization roles)
CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'STAFF', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, user_id)
);

-- 4. GOOGLE_BUSINESS_PROFILES (Google Business Profile & OAuth credentials)
CREATE TABLE IF NOT EXISTS google_business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    account_id VARCHAR(255),
    location_id VARCHAR(255),
    place_id VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    overall_rating NUMERIC(2, 1),
    total_review_count INT DEFAULT 0,
    is_connected BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBSCRIPTION_PLANS (Free launch plan and future tiers)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    price_monthly NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMING_SOON')),
    max_active_qr_codes INT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBSCRIPTIONS (Business subscription status)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED')),
    max_active_qr_codes INT DEFAULT 1,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    razorpay_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QR_CODES (Trackable Google Review QR Codes)
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. "qr_8f3a9b1c" used in /r/qr_8f3a9b1c
    destination_url TEXT NOT NULL, -- Configured official Google Review Link
    placement VARCHAR(100) DEFAULT 'Counter',
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED')),
    total_scans INT DEFAULT 0,
    unique_scans INT DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. QR_SCAN_EVENTS (Immutable scan events recorded on redirect)
CREATE TABLE IF NOT EXISTS qr_scan_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    device_type VARCHAR(50) DEFAULT 'mobile' CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
    os VARCHAR(50),
    browser VARCHAR(50),
    ip_hash VARCHAR(64) NOT NULL, -- SHA256 hashed with salt for privacy-compliant unique counting
    city VARCHAR(100),
    country VARCHAR(100),
    referrer TEXT,
    redirect_url TEXT NOT NULL
);

-- 9. USAGE_COUNTERS (Plan enforcement and scan tally)
CREATE TABLE IF NOT EXISTS usage_counters (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    active_qr_codes INT DEFAULT 0,
    total_scans_month INT DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INTEGRATION_CONNECTIONS (External OAuth & API Connections)
CREATE TABLE IF NOT EXISTS integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google_business', 'razorpay', 'webhook')),
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    encrypted_credentials TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    connected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, provider)
);

-- 11. AUDIT_LOGS (Security, Admin, and Operations Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR FAST PERFORMANCE & FAST REDIRECTS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business ON qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_qr_code ON qr_scan_events(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_business ON qr_scan_events(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_scanned_at ON qr_scan_events(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);

-- ============================================================
-- INITIALIZE DEFAULT SUBSCRIPTION PLANS
-- ============================================================
INSERT INTO subscription_plans (id, name, display_name, price_monthly, currency, status, max_active_qr_codes, features)
VALUES 
    ('plan_free', 'FREE', 'Free Launch', 0.00, 'USD', 'ACTIVE', 1, '["One business", "One active QR code", "Direct Google review redirection", "Basic scan analytics", "High-res PNG download", "Basic dashboard"]'::jsonb),
    ('plan_starter', 'STARTER', 'Starter Tier', 19.00, 'USD', 'COMING_SOON', 5, '["Multiple QR codes", "Advanced scan analytics", "SVG and print-ready PDF exports", "QR placement comparison", "Extended analytics history"]'::jsonb),
    ('plan_growth', 'GROWTH', 'Growth Tier', 49.00, 'USD', 'COMING_SOON', 20, '["Authorized Google Business Profile integration", "Review monitoring", "Review response tools", "Advanced reporting", "Multiple locations"]'::jsonb),
    ('plan_pro', 'PRO', 'Pro Tier', 99.00, 'USD', 'COMING_SOON', 999, '["Multi-branch management", "Team access", "Advanced reporting", "More integrations", "Automated reputation reports"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check business membership
CREATE OR REPLACE FUNCTION auth_user_has_business_access(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b_id AND bm.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can see & edit their own profile
CREATE POLICY profiles_user_policy ON profiles
    FOR ALL USING (id = auth.uid());

-- Businesses: Isolated to members of the business or super admins
CREATE POLICY business_isolation_policy ON businesses
    FOR ALL USING (auth_user_has_business_access(id));

-- Business members: Accessible only to members of the business
CREATE POLICY business_members_policy ON business_members
    FOR ALL USING (auth_user_has_business_access(business_id));

-- Subscription Plans: Publicly readable by all authenticated users
CREATE POLICY subscription_plans_read_policy ON subscription_plans
    FOR SELECT TO authenticated USING (true);

-- Subscriptions: Accessible only to business members
CREATE POLICY subscriptions_business_policy ON subscriptions
    FOR ALL USING (auth_user_has_business_access(business_id));

-- QR Codes: Accessible only to business members
CREATE POLICY qr_codes_business_policy ON qr_codes
    FOR ALL USING (auth_user_has_business_access(business_id));

-- QR Scan Events: Readable only by business members (public redirect service inserts via service_role)
CREATE POLICY qr_scan_events_read_policy ON qr_scan_events
    FOR SELECT USING (auth_user_has_business_access(business_id));

-- Google Business Profiles: Accessible only to business members
CREATE POLICY gbp_business_policy ON google_business_profiles
    FOR ALL USING (auth_user_has_business_access(business_id));

-- Usage counters: Accessible only to business members
CREATE POLICY usage_counters_policy ON usage_counters
    FOR ALL USING (auth_user_has_business_access(business_id));

-- Integration connections: Strictly isolated to business members
CREATE POLICY integrations_isolation_policy ON integration_connections
    FOR ALL USING (auth_user_has_business_access(business_id));

-- Audit logs: Readable only by business admins or platform super admins
CREATE POLICY audit_logs_isolation_policy ON audit_logs
    FOR SELECT USING (
        (business_id IS NOT NULL AND auth_user_has_business_access(business_id))
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
    );
