FROM golang:1.24.2-alpine AS builder
RUN apk add --no-cache gcc musl-dev git
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY server.go ./
RUN CGO_ENABLED=1 go build -o server server.go

FROM alpine:latest
RUN apk add --no-cache ca-certificates libc6-compat sqlite
WORKDIR /app
COPY --from=builder /app/server /app/server
COPY dist/ /app/dist/
ENV GITHUB_CLIENT_ID=Ov23li5K1Kei86DcD81Q 
ENV GITHUB_CLIENT_SECRET=9d935b013c45c0cef1739e1fdd97654346ede14e
ENV OAUTH_REDIRECT_URL=http://localhost:3000/api/login/callback
ENV JWT_SECRET=GD5hVf2ArU0V5IaTTdEWnzvs6rETahjpoLZl4ABOV0Ew57z3j/ulH6/D7ANutR3Og02KvwMKxOGH1Jn6GYlJlA== 
EXPOSE 3000
CMD ["/app/server"]
