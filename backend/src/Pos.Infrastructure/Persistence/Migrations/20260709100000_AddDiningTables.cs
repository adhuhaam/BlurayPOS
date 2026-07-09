using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pos.Infrastructure.Persistence.Migrations
{
    public partial class AddDiningTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiningAreas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiningAreas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiningAreas_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiningTables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: false),
                    DiningAreaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    QrToken = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiningTables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiningTables_DiningAreas_DiningAreaId",
                        column: x => x.DiningAreaId,
                        principalTable: "DiningAreas",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DiningTables_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "DiningTableId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderSource",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ServiceType",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SentToKitchenAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BillRequestedAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiningAreas_StoreId_Name",
                table: "DiningAreas",
                columns: new[] { "StoreId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_DiningAreaId",
                table: "DiningTables",
                column: "DiningAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_StoreId_Code",
                table: "DiningTables",
                columns: new[] { "StoreId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DiningTableId",
                table: "Orders",
                column: "DiningTableId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_DiningTables_DiningTableId",
                table: "Orders",
                column: "DiningTableId",
                principalTable: "DiningTables",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_DiningTables_DiningTableId",
                table: "Orders");

            migrationBuilder.DropTable(name: "DiningTables");
            migrationBuilder.DropTable(name: "DiningAreas");

            migrationBuilder.DropIndex(name: "IX_Orders_DiningTableId", table: "Orders");

            migrationBuilder.DropColumn(name: "DiningTableId", table: "Orders");
            migrationBuilder.DropColumn(name: "OrderSource", table: "Orders");
            migrationBuilder.DropColumn(name: "ServiceType", table: "Orders");
            migrationBuilder.DropColumn(name: "SentToKitchenAt", table: "Orders");
            migrationBuilder.DropColumn(name: "BillRequestedAt", table: "Orders");
        }
    }
}
