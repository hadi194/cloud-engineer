package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"fullstack-backend/internal/auth"
	"fullstack-backend/internal/db"
	"fullstack-backend/internal/handler"
	"fullstack-backend/internal/middleware"
	"fullstack-backend/internal/storage"
)

func main() {
	database, err := db.Connect(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("DB connect failed:", err)
	}
	defer database.Close()
	db.Migrate(database)

	minioClient, err := storage.NewMinIO(
		os.Getenv("MINIO_ENDPOINT"),
		os.Getenv("MINIO_ACCESS_KEY"),
		os.Getenv("MINIO_SECRET_KEY"),
		os.Getenv("MINIO_PUBLIC_URL"),
	)
	if err != nil {
		log.Fatal("MinIO connect failed:", err)
	}

	jwtService := auth.NewJWT(os.Getenv("JWT_SECRET"))

	authHandler := handler.NewAuth(database, jwtService)
	userHandler := handler.NewUser(database)
	uploadHandler := handler.NewUpload(minioClient)

	r := gin.Default()
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	r.POST("/auth/login", authHandler.Login)

	api := r.Group("/api", middleware.Auth(jwtService))
	{
		api.GET("/users", userHandler.List)
		api.POST("/upload", uploadHandler.Upload)
	}

	log.Println("Server listening on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
