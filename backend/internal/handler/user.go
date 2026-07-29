package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type User struct {
	db *sql.DB
}

func NewUser(db *sql.DB) *User {
	return &User{db: db}
}

type userRow struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (u *User) List(c *gin.Context) {
	rows, err := u.db.Query(`SELECT id, name, email, role, created_at FROM users ORDER BY id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []userRow
	for rows.Next() {
		var r userRow
		if err := rows.Scan(&r.ID, &r.Name, &r.Email, &r.Role, &r.CreatedAt); err != nil {
			continue
		}
		users = append(users, r)
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
