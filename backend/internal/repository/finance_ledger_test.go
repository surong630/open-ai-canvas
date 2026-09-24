package repository

import (
	"testing"
	"time"

	"infinite-canvas/backend/internal/model"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestCreditLedgerFilteredIncludesTopupsAndAggregatesDateRange(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+newRepositoryID()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&model.CreditLedgerEntry{}); err != nil {
		t.Fatal(err)
	}
	base := time.Date(2026, 9, 20, 0, 0, 0, 0, time.UTC)
	entries := []model.CreditLedgerEntry{
		{ID: "topup", UserID: "user", Type: model.CreditLedgerPaymentTopup, AmountMicrocredits: 2_000_000, CreatedAt: base.Add(12 * time.Hour)},
		{ID: "bonus", UserID: "user", Type: model.CreditLedgerSignupBonus, AmountMicrocredits: 1_000_000, CreatedAt: base.Add(24 * time.Hour)},
		{ID: "outside", UserID: "user", Type: model.CreditLedgerRedeem, AmountMicrocredits: 9_000_000, CreatedAt: base.Add(-time.Hour)},
		{ID: "consume", UserID: "user", Type: model.CreditLedgerConsume, AmountMicrocredits: -500_000, CreatedAt: base.Add(13 * time.Hour)},
	}
	if err := db.Create(&entries).Error; err != nil {
		t.Fatal(err)
	}
	end := base.Add(48 * time.Hour)
	items, total, amount, err := New(db).CreditLedgerFiltered("user", "income", 20, 0, &base, &end)
	if err != nil {
		t.Fatal(err)
	}
	if total != 2 || len(items) != 2 {
		t.Fatalf("income entries = %d/%d, want 2/2", len(items), total)
	}
	if amount != 3_000_000 {
		t.Fatalf("total amount = %d, want 3000000", amount)
	}
}
