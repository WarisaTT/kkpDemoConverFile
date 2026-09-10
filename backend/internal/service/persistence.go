package service

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/kkp/ai-data-transformation/internal/model"
)

const (
	dataDir        = "data/processes"
	rawFileSuffix  = ".raw"
	jsonFileSuffix = ".json"
)

// ensureDataDir creates the data directory if it doesn't exist.
func ensureDataDir() error {
	return os.MkdirAll(dataDir, 0755)
}

// SaveProcess writes a process to disk as JSON + optional raw file bytes.
func SaveProcess(proc *model.Process) error {
	if err := ensureDataDir(); err != nil {
		return fmt.Errorf("failed to create data dir: %w", err)
	}

	// Save raw file bytes separately to keep JSON manageable
	if len(proc.RawFileBytes) > 0 {
		rawPath := filepath.Join(dataDir, proc.ID+rawFileSuffix)
		if err := os.WriteFile(rawPath, proc.RawFileBytes, 0644); err != nil {
			log.Printf("Warning: failed to save raw file for %s: %v", proc.ID, err)
		}
	}

	// Marshal process to JSON (RawFileBytes is excluded via json:"-")
	data, err := json.Marshal(proc)
	if err != nil {
		return fmt.Errorf("failed to marshal process %s: %w", proc.ID, err)
	}

	jsonPath := filepath.Join(dataDir, proc.ID+jsonFileSuffix)
	if err := os.WriteFile(jsonPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write process file %s: %w", proc.ID, err)
	}

	return nil
}

// LoadAllProcesses reads all persisted processes from disk.
func LoadAllProcesses() (map[string]*model.Process, error) {
	if err := ensureDataDir(); err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read data dir: %w", err)
	}

	processes := make(map[string]*model.Process)

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), jsonFileSuffix) {
			continue
		}

		jsonPath := filepath.Join(dataDir, entry.Name())
		data, err := os.ReadFile(jsonPath)
		if err != nil {
			log.Printf("Warning: failed to read process file %s: %v", entry.Name(), err)
			continue
		}

		var proc model.Process
		if err := json.Unmarshal(data, &proc); err != nil {
			log.Printf("Warning: failed to parse process file %s: %v", entry.Name(), err)
			continue
		}

		// Load raw file bytes if available
		rawPath := filepath.Join(dataDir, proc.ID+rawFileSuffix)
		if rawBytes, err := os.ReadFile(rawPath); err == nil {
			proc.RawFileBytes = rawBytes
		}

		processes[proc.ID] = &proc
	}

	log.Printf("Loaded %d persisted processes from disk", len(processes))
	return processes, nil
}

// DeleteProcessFile removes a process's files from disk.
func DeleteProcessFile(id string) error {
	jsonPath := filepath.Join(dataDir, id+jsonFileSuffix)
	rawPath := filepath.Join(dataDir, id+rawFileSuffix)

	// Remove JSON file
	if err := os.Remove(jsonPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete process file %s: %w", id, err)
	}

	// Remove raw file (ignore if not exists)
	os.Remove(rawPath)

	return nil
}
