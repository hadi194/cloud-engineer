package storage

import (
	"context"
	"fmt"
	"io"
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const bucket = "uploads"

type MinIO struct {
	client    *minio.Client
	publicURL string
}

func NewMinIO(endpoint, accessKey, secretKey, publicURL string) (*MinIO, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, err
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, err
		}
		// Make the bucket publicly readable so browser can load uploaded images
		policy := fmt.Sprintf(`{
			"Version":"2012-10-17",
			"Statement":[{
				"Effect":"Allow",
				"Principal":{"AWS":["*"]},
				"Action":["s3:GetObject"],
				"Resource":["arn:aws:s3:::%s/*"]
			}]
		}`, bucket)
		if err := client.SetBucketPolicy(ctx, bucket, policy); err != nil {
			log.Println("warning: could not set bucket policy:", err)
		}
	}

	return &MinIO{client: client, publicURL: publicURL}, nil
}

func (m *MinIO) Upload(ctx context.Context, name string, r io.Reader, size int64) (string, error) {
	_, err := m.client.PutObject(ctx, bucket, name, r, size, minio.PutObjectOptions{})
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s/%s", m.publicURL, bucket, name), nil
}
