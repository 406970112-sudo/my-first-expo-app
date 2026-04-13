package httpapi

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	buckets map[string]*bucket
	max     int
	mu      sync.Mutex
	window  time.Duration
}

type bucket struct {
	count   int
	resetAt time.Time
}

func NewRateLimiter(window time.Duration, max int) *RateLimiter {
	return &RateLimiter{
		buckets: make(map[string]*bucket),
		max:     max,
		window:  window,
	}
}

func (r *RateLimiter) Allow(key string) (retryAfterSeconds int, limited bool) {
	now := time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	for bucketKey, bucketValue := range r.buckets {
		if now.After(bucketValue.resetAt) {
			delete(r.buckets, bucketKey)
		}
	}

	currentBucket, ok := r.buckets[key]
	if !ok || now.After(currentBucket.resetAt) {
		r.buckets[key] = &bucket{
			count:   1,
			resetAt: now.Add(r.window),
		}
		return 0, false
	}

	if currentBucket.count >= r.max {
		return int(currentBucket.resetAt.Sub(now).Seconds()) + 1, true
	}

	currentBucket.count++
	return 0, false
}

func clientIPFromRequest(r *http.Request) string {
	forwardedFor := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if forwardedFor != "" {
		parts := strings.Split(forwardedFor, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	return r.RemoteAddr
}
