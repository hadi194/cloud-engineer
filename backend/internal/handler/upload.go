package handler

import (
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"fullstack-backend/internal/storage"
)

type Upload struct {
	store *storage.MinIO
}

func NewUpload(store *storage.MinIO) *Upload {
	return &Upload{store: store}
}

func (u *Upload) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only image files are allowed (jpg, png, gif, webp)"})
		return
	}

	name := time.Now().Format("20060102150405") + ext
	url, err := u.store.Upload(c.Request.Context(), name, file, header.Size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url, "filename": name})
}
