using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pos.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplyAndRecipes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InventoryMode",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SlipImagePath",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentInstructions",
                table: "Organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentQrPayload",
                table: "Organizations",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SupplyItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplyItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplyItems_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductRecipes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplyItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductRecipes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductRecipes_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductRecipes_SupplyItems_SupplyItemId",
                        column: x => x.SupplyItemId,
                        principalTable: "SupplyItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoreSupplyStocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplyItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentStock = table.Column<decimal>(type: "numeric", nullable: false),
                    CostPerUnit = table.Column<decimal>(type: "numeric", nullable: false),
                    LowStockThreshold = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreSupplyStocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreSupplyStocks_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StoreSupplyStocks_SupplyItems_SupplyItemId",
                        column: x => x.SupplyItemId,
                        principalTable: "SupplyItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupplyLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplyItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric", nullable: false),
                    CostPerUnit = table.Column<decimal>(type: "numeric", nullable: true),
                    TotalCost = table.Column<decimal>(type: "numeric", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    SuppliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplyLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplyLogs_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SupplyLogs_SupplyItems_SupplyItemId",
                        column: x => x.SupplyItemId,
                        principalTable: "SupplyItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductRecipes_ProductId_SupplyItemId",
                table: "ProductRecipes",
                columns: new[] { "ProductId", "SupplyItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductRecipes_SupplyItemId",
                table: "ProductRecipes",
                column: "SupplyItemId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreSupplyStocks_StoreId_SupplyItemId",
                table: "StoreSupplyStocks",
                columns: new[] { "StoreId", "SupplyItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoreSupplyStocks_SupplyItemId",
                table: "StoreSupplyStocks",
                column: "SupplyItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyItems_OrganizationId",
                table: "SupplyItems",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyLogs_StoreId",
                table: "SupplyLogs",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyLogs_SupplyItemId",
                table: "SupplyLogs",
                column: "SupplyItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductRecipes");

            migrationBuilder.DropTable(
                name: "StoreSupplyStocks");

            migrationBuilder.DropTable(
                name: "SupplyLogs");

            migrationBuilder.DropTable(
                name: "SupplyItems");

            migrationBuilder.DropColumn(
                name: "InventoryMode",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SlipImagePath",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentInstructions",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "PaymentQrPayload",
                table: "Organizations");
        }
    }
}
