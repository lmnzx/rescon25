package main

import (
	"database/sql"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/storage/sqlite3/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"

	_ "github.com/mattn/go-sqlite3"
)

type TypeTestRequest struct {
	Wpm      int `json:"wpm"`
	Accuracy int `json:"accuracy"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type User struct {
	ID        int    `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

type LeaderboardEntry struct {
	Login    string `json:"login"`
	WPM      int    `json:"max_wpm"`
	Accuracy int    `json:"accuracy"`
}

var (
	githubOAuthConfig *oauth2.Config
	jwtSecret         []byte
	store             *session.Store
	typeboardDb       *sql.DB
)

func init() {
	githubOAuthConfig = &oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("OAUTH_REDIRECT_URL"),
		Scopes:       []string{"read:user"},
		Endpoint:     github.Endpoint,
	}
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	sessionStore := sqlite3.New()
	store = session.New(
		session.Config{
			Storage: sessionStore,
		})

	db, err := sql.Open("sqlite3", "./typeboard.sqlite3?_busy_timeout=5000&_journal_mode=WAL")
	if err != nil {
		log.Fatal(err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	typeboardDb = db

	_, err = typeboardDb.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY,
			login TEXT NOT NULL UNIQUE,
			name TEXT,
			avatar_url TEXT
		);

		CREATE TABLE IF NOT EXISTS typetests (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			wpm INTEGER NOT NULL,
			accuracy INTEGER NOT NULL,
			userid INTEGER NOT NULL,
			FOREIGN KEY (userid) REFERENCES users(id)
		);

		CREATE INDEX IF NOT EXISTS idx_typetests_wpm ON typetests(wpm);
		CREATE INDEX IF NOT EXISTS idx_typetests_userid ON typetests(userid);
	`)

	if err != nil {
		log.Fatal(err)
	}
}

func (u *User) InsertNewUser() {
	_, err := typeboardDb.Exec(`
		INSERT INTO users (id, login, name, avatar_url)
        VALUES (?, ?, ?, ?)
		`, u.ID, u.Login, u.Name, u.AvatarURL)
	if err != nil {
		fmt.Println(err)
	}
}

func (u *User) InsertNewRecord(t *TypeTestRequest) {
	_, err := typeboardDb.Exec(`
        INSERT INTO typetests (wpm, accuracy, userid)
        VALUES (?, ?, ?)
    `, t.Wpm, t.Accuracy, u.ID)
	if err != nil {
		fmt.Println(err)
	}
}

func (u *User) GetUserByID() *User {
	row := typeboardDb.QueryRow(`
        SELECT id, login, name, avatar_url 
        FROM users 
        WHERE id = ?
    `, u.ID)

	var user User
	var nullableName sql.NullString

	err := row.Scan(&user.ID, &user.Login, &nullableName, &user.AvatarURL)
	if err == sql.ErrNoRows {
		return nil
	}

	if err != nil {
		fmt.Println(err)
		return nil
	}
	if nullableName.Valid {
		user.Name = nullableName.String
	} else {
		user.Name = ""
	}

	return &user
}

func GetUserByLogin(login string) *User {
	row := typeboardDb.QueryRow(`
        SELECT id, login, name, avatar_url 
        FROM users 
        WHERE login = ?
    `, login)

	var user User
	var nullableName sql.NullString

	err := row.Scan(&user.ID, &user.Login, &nullableName, &user.AvatarURL)
	if err == sql.ErrNoRows {
		return nil
	}

	if err != nil {
		fmt.Println(err)
		return nil
	}
	if nullableName.Valid {
		user.Name = nullableName.String
	} else {
		user.Name = ""
	}

	return &user
}

func GetLeaderBoardData() []LeaderboardEntry {
	rows, err := typeboardDb.Query(`
		SELECT 
			users.login, 
			MAX(typetests.wpm) as max_wpm,
			(SELECT accuracy FROM typetests t 
			 WHERE t.userid = users.id 
			 ORDER BY wpm DESC LIMIT 1) as best_accuracy
		FROM typetests
		JOIN users ON typetests.userid = users.id
		GROUP BY users.id
		ORDER BY max_wpm DESC
		LIMIT 10;
		`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var leaderboard []LeaderboardEntry
	for rows.Next() {
		var entry LeaderboardEntry
		if err := rows.Scan(&entry.Login, &entry.WPM, &entry.Accuracy); err != nil {
			return nil
		}
		leaderboard = append(leaderboard, entry)
	}
	return leaderboard
}

func HealthCheck(c *fiber.Ctx) error {
	return c.SendString("all ok 👍🏻")
}

func InitiateGitHubLogin(c *fiber.Ctx) error {
	state := fmt.Sprintf("%d", time.Now().UnixNano())

	sess, err := store.Get(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create session",
		})
	}
	sess.Set("oauth_state", state)
	if err := sess.Save(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save session",
		})
	}

	url := githubOAuthConfig.AuthCodeURL(state)
	return c.Redirect(url)
}

func HandleGitHubCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	returnedState := c.Query("state")

	sess, err := store.Get(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get session",
		})
	}

	originalState := sess.Get("oauth_state")
	if originalState == nil || originalState.(string) != returnedState {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid OAuth state",
		})
	}

	token, err := githubOAuthConfig.Exchange(c.Context(), code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to exchange code for token",
		})
	}
	client := githubOAuthConfig.Client(c.Context(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info from GitHub",
		})
	}
	defer resp.Body.Close()

	var githubUser User
	if err := json.NewDecoder(resp.Body).Decode(&githubUser); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse user info",
		})
	}

	if githubUser.GetUserByID() == nil {
		githubUser.InsertNewUser()
		slog.Info("new user added", githubUser.Login, githubUser.ID)
	} else {
		slog.Info("old user login", githubUser.Login, githubUser.ID)
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: githubUser.Login,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token2 := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token2.SignedString(jwtSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	cookie := fiber.Cookie{
		Name:     "token",
		Value:    tokenString,
		Expires:  expirationTime,
		HTTPOnly: true,
		Path:     "/",
	}
	c.Cookie(&cookie)

	return c.Status(fiber.StatusOK).Redirect("/")
}

func GetAuthStatus(c *fiber.Ctx) error {
	username := c.Locals("username")

	if username == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"authenticated": false,
		})
	}

	row := typeboardDb.QueryRow(`
        SELECT id, login, name, avatar_url 
        FROM users 
        WHERE login = ?
    `, username.(string))

	var user User
	var nullableName sql.NullString

	err := row.Scan(&user.ID, &user.Login, &nullableName, &user.AvatarURL)
	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"authenticated": false,
		})
	}
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"authenticated": false,
		})
	}
	if nullableName.Valid {
		user.Name = nullableName.String
	} else {
		user.Name = ""
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"username":   user.Login,
		"avatar_url": user.AvatarURL,
	})
}
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := ""
		cookie := c.Cookies("token")
		if cookie != "" {
			tokenString = cookie
		} else if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		if tokenString == "" {
			return c.Next()
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			return c.Next()
		}

		c.Locals("username", claims.Username)
		return c.Next()
	}
}

func SubmitTypeTest(c *fiber.Ctx) error {
	username := c.Locals("username")

	if username == nil {
		return c.SendStatus(200)
	}

	u := GetUserByLogin(username.(string))

	t := new(TypeTestRequest)
	if err := c.BodyParser(&t); err != nil {
		return err
	}

	u.InsertNewRecord(t)

	return c.SendStatus(200)
}

func GetLeaderBoard(c *fiber.Ctx) error {
	return c.JSON(GetLeaderBoardData())
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	slog.SetDefault(logger)

	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
		Prefork:     true,
	})

	app.Use(AuthMiddleware())

	app.Get("/api/login", InitiateGitHubLogin)
	app.Get("/api/login/callback", HandleGitHubCallback)
	app.Get("/api/auth/status", GetAuthStatus)

	app.Get("/api/health_check", HealthCheck)
	app.Post("/api/submit", SubmitTypeTest)
	app.Get("/api/leaderboard", cache.New(cache.Config{
		Expiration:   30 * time.Second,
		CacheControl: true,
	}), GetLeaderBoard)

	app.Static("/", "/root/typeboard/dist/")
	app.Get("/*", func(ctx *fiber.Ctx) error {
		return ctx.SendFile("/root/typeboard/dist/index.html")
	})

	app.Listen(":3000")
}
