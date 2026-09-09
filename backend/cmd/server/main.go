package main

import (
	"bufio"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/kkp/ai-data-transformation/internal/handler"
	"github.com/kkp/ai-data-transformation/internal/parser"
	"github.com/kkp/ai-data-transformation/internal/service"
)

func loadEnvFiles() {
	envFiles := []string{".env", "../.env", "backend/.env"}
	for _, f := range envFiles {
		file, err := os.Open(f)
		if err != nil {
			continue
		}
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
				if os.Getenv(k) == "" {
					os.Setenv(k, v)
				}
			}
		}
		file.Close()
		log.Printf("Loaded environment variables from %s", f)
		break
	}
}

func main() {
	loadEnvFiles()

	app := fiber.New(fiber.Config{
		AppName: "KKP AI Data Transformation Platform API v1.0",
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	excelParser := parser.NewExcelParser()
	transformSvc := service.NewTransformService(nil, excelParser)
	apiHandler := handler.NewHandler(transformSvc)

	apiHandler.RegisterRoutes(app)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "UP", "service": "KKP AI Backend"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf(" KKP AI Backend server starting on port %s...", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
