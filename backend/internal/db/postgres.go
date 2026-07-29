package db

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func Connect(dsn string) (*sql.DB, error) {
	d, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	if err := d.Ping(); err != nil {
		return nil, err
	}
	return d, nil
}

func Migrate(d *sql.DB) {
	_, err := d.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id         SERIAL PRIMARY KEY,
			name       TEXT NOT NULL,
			email      TEXT UNIQUE NOT NULL,
			password   TEXT NOT NULL,
			role       TEXT NOT NULL DEFAULT 'user',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		log.Fatal("migration failed:", err)
	}

	seed := []struct{ name, email, password, role string }{
		{"Admin", "admin@local.dev", "admin123", "admin"},
		{"Alice Smith", "alice@example.com", "password123", "user"},
		{"Bob Jones", "bob@example.com", "password123", "user"},
		{"Carol White", "carol@example.com", "password123", "user"},
		{"Dave Brown", "dave@example.com", "password123", "user"},
		{"Eve Wilson", "eve@example.com", "password123", "user"},
	}

	for _, u := range seed {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		d.Exec(
			`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
			u.name, u.email, string(hash), u.role,
		)
	}
}
