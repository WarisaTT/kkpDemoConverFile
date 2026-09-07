package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/kkp/ai-data-transformation/internal/ai"
	"github.com/kkp/ai-data-transformation/internal/handler"
	"github.com/kkp/ai-data-transformation/internal/parser"
	"github.com/kkp/ai-data-transformation/internal/service"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "KKP AI Data Transformation Platform API v1.0",
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	aiProvider := ai.NewMockAIProvider()
	excelParser := parser.NewExcelParser()
	transformSvc := service.NewTransformService(aiProvider, excelParser)
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
