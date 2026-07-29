package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"fullstack-backend/internal/auth"
)

type Auth struct {
	db  *sql.DB
	jwt *auth.JWT
}

func NewAuth(db *sql.DB, jwt *auth.JWT) *Auth {
	return &Auth{db: db, jwt: jwt}
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (a *Auth) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var (
		id       int
		name     string
		password string
		role     string
	)
	err := a.db.QueryRow(
		`SELECT id, name, password, role FROM users WHERE email = $1`,
		req.Email,
	).Scan(&id, &name, &password, &role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := a.jwt.Sign(id, req.Email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not sign token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  gin.H{"id": id, "name": name, "email": req.Email, "role": role},
	})
}
