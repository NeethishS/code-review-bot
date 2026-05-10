import pool from './index';

const createTables = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        display_name VARCHAR(255),
        avatar_url TEXT,
        github_login VARCHAR(255),
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        webhook_secret TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS repositories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        language VARCHAR(100),
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        repository_id INTEGER REFERENCES repositories(id) ON DELETE SET NULL,
        language VARCHAR(100) NOT NULL,
        analysis_type VARCHAR(100) NOT NULL,
        code_snippet TEXT,
        result JSONB,
        tokens_used INTEGER DEFAULT 0,
        cost NUMERIC(10, 8) DEFAULT 0,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('success', 'warning', 'info', 'error')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    
        -- Retroactively add columns to existing tables
        ALTER TABLE repositories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS webhook_secret TEXT UNIQUE;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reviews_analysis_type ON reviews(analysis_type);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
`;

async function migrate() {
    try {
        await pool.query(createTables);
        console.log('✅ Database tables created/verified');
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    }
}

export default migrate;
