package handler

import (
	"fmt"
	"io"
	"github.com/kkp/ai-data-transformation/internal/model"

	"github.com/gofiber/fiber/v2"
	"github.com/kkp/ai-data-transformation/internal/service"
)

type Handler struct {
	svc *service.TransformService
}

func NewHandler(svc *service.TransformService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	api.Get("/stats", h.GetStats)
	api.Get("/templates", h.GetTemplates)
	api.Post("/templates", h.CreateTemplate)
	api.Put("/templates/:id", h.UpdateTemplate)
	api.Delete("/templates/:id", h.DeleteTemplate)
	api.Get("/audit-logs", h.GetAuditLogs)
	api.Get("/settings/ai", h.GetAISettings)
	api.Post("/settings/ai", h.UpdateAISettings)

	api.Get("/processes", h.GetProcesses)
	api.Post("/files/upload", h.UploadFile)
	api.Post("/upload", h.UploadFile)
	api.Get("/processes/:id", h.GetProcess)
	api.Put("/processes/:id/step", h.UpdateProcessStep)
	api.Delete("/processes/:id", h.DeleteProcess)
	api.Post("/processes/:id/mappings/:mappingId/approve", h.ApproveMapping)
	api.Put("/processes/:id/mappings/:mappingId", h.UpdateMapping)
	api.Get("/processes/:id/export", h.ExportExcel)
}

func (h *Handler) GetStats(c *fiber.Ctx) error {
	return c.JSON(h.svc.GetStats())
}

func (h *Handler) GetTemplates(c *fiber.Ctx) error {
	return c.JSON(h.svc.GetTemplates())
}

func (h *Handler) CreateTemplate(c *fiber.Ctx) error {
	var tmpl model.TargetTemplate
	if err := c.BodyParser(&tmpl); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid template payload"})
	}
	if tmpl.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "template name is required"})
	}
	created, err := h.svc.CreateTemplate(tmpl)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *Handler) UpdateTemplate(c *fiber.Ctx) error {
	id := c.Params("id")
	var tmpl model.TargetTemplate
	if err := c.BodyParser(&tmpl); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	updated, err := h.svc.UpdateTemplate(id, tmpl)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(updated)
}

func (h *Handler) DeleteTemplate(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteTemplate(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "template deleted successfully"})
}

func (h *Handler) GetAuditLogs(c *fiber.Ctx) error {
	return c.JSON(h.svc.GetAuditLogs())
}

func (h *Handler) GetAISettings(c *fiber.Ctx) error {
	return c.JSON(h.svc.GetAIConfig())
}

func (h *Handler) UpdateAISettings(c *fiber.Ctx) error {
	type reqBody struct {
		APIKey  string `json:"api_key"`
		BaseURL string `json:"base_url"`
		Model   string `json:"model"`
	}
	var body reqBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}

	h.svc.SetLlamaConfig(body.APIKey, body.BaseURL, body.Model)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Llama AI configuration updated successfully",
	})
}


func (h *Handler) GetProcesses(c *fiber.Ctx) error {
	return c.JSON(h.svc.GetProcesses())
}


func (h *Handler) DeleteProcess(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteProcess(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "ลบการวิเคราะห์และยกเลิกการนำไปใช้พัฒนา AI เรียบร้อยแล้ว"})
}

func (h *Handler) UpdateProcessStep(c *fiber.Ctx) error {
	id := c.Params("id")
	type req struct {
		Step   int    `json:"step"`
		Status string `json:"status"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil || body.Step < 1 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid step"})
	}
	proc, err := h.svc.UpdateProcessStep(id, body.Step, body.Status)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(proc)
}

func (h *Handler) UploadFile(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	var fileBytes []byte
	fileName := "uploaded_file.xlsx"
	fileSize := "2.48 MB"

	if err == nil && file != nil {
		fileName = file.Filename
		fileSize = fmt.Sprintf("%.2f MB", float64(file.Size)/(1024*1024))
		f, errOpen := file.Open()
		if errOpen == nil {
			defer f.Close()
			fileBytes, _ = io.ReadAll(f)
		}
	}

	proc, err := h.svc.CreateProcess(fileName, fileSize, fileBytes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(proc)
}

func (h *Handler) GetProcess(c *fiber.Ctx) error {
	id := c.Params("id")
	proc, err := h.svc.GetProcess(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Process not found"})
	}
	return c.JSON(proc)
}

func (h *Handler) ApproveMapping(c *fiber.Ctx) error {
	pID := c.Params("id")
	mID := c.Params("mappingId")
	user := c.Query("user", "Warisa T.")

	mapping, err := h.svc.ApproveMapping(pID, mID, user)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(mapping)
}

func (h *Handler) UpdateMapping(c *fiber.Ctx) error {
	pID := c.Params("id")
	mID := c.Params("mappingId")
	user := c.Query("user", "Warisa T.")

	type reqBody struct {
		TargetField string `json:"target_field"`
	}
	var body reqBody
	if err := c.BodyParser(&body); err != nil || body.TargetField == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid target_field"})
	}

	mapping, err := h.svc.UpdateMapping(pID, mID, body.TargetField, user)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(mapping)
}

func (h *Handler) ExportExcel(c *fiber.Ctx) error {
	pID := c.Params("id")
	bytes, fileName, err := h.svc.GenerateExcel(pID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	return c.Send(bytes)
}
