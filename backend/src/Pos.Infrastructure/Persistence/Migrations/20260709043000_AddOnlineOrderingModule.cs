using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pos.Infrastructure.Persistence.Migrations
{
    public partial class AddOnlineOrderingModule : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasOnlineMenu",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasOnlineOrdering",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

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

            migrationBuilder.AddColumn<string>(
                name: "PublicTrackingToken",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DiningTableId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerPhone",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryAddress",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryNotes",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledFor",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OnlinePaymentMethod",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectedReason",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PublicTrackingToken",
                table: "Orders",
                column: "PublicTrackingToken",
                unique: true,
                filter: "\"PublicTrackingToken\" IS NOT NULL");

            migrationBuilder.AddColumn<bool>(
                name: "IsOnlineVisible",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "OnlineDescription",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OnlineMenuEnabled",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "OnlineOrderingEnabled",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowPickup",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowDelivery",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowDineIn",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowCashOnDelivery",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowBankTransfer",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinOrderAmount",
                table: "Stores",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryFeeFlat",
                table: "Stores",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "OnlineMenuWelcomeText",
                table: "Stores",
                type: "text",
                nullable: true);

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
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DiningTables_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DiningAreas_StoreId",
                table: "DiningAreas",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_DiningAreaId",
                table: "DiningTables",
                column: "DiningAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_QrToken",
                table: "DiningTables",
                column: "QrToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_StoreId",
                table: "DiningTables",
                column: "StoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_DiningTables_DiningTableId",
                table: "Orders",
                column: "DiningTableId",
                principalTable: "DiningTables",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_DiningTables_DiningTableId",
                table: "Orders");

            migrationBuilder.DropTable(name: "DiningTables");
            migrationBuilder.DropTable(name: "DiningAreas");

            migrationBuilder.DropIndex(name: "IX_Orders_PublicTrackingToken", table: "Orders");

            migrationBuilder.DropColumn(name: "HasOnlineMenu", table: "Plans");
            migrationBuilder.DropColumn(name: "HasOnlineOrdering", table: "Plans");
            migrationBuilder.DropColumn(name: "OrderSource", table: "Orders");
            migrationBuilder.DropColumn(name: "ServiceType", table: "Orders");
            migrationBuilder.DropColumn(name: "PublicTrackingToken", table: "Orders");
            migrationBuilder.DropColumn(name: "DiningTableId", table: "Orders");
            migrationBuilder.DropColumn(name: "CustomerName", table: "Orders");
            migrationBuilder.DropColumn(name: "CustomerPhone", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryAddress", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryNotes", table: "Orders");
            migrationBuilder.DropColumn(name: "ScheduledFor", table: "Orders");
            migrationBuilder.DropColumn(name: "OnlinePaymentMethod", table: "Orders");
            migrationBuilder.DropColumn(name: "RejectedReason", table: "Orders");
            migrationBuilder.DropColumn(name: "IsOnlineVisible", table: "Products");
            migrationBuilder.DropColumn(name: "OnlineDescription", table: "Products");
            migrationBuilder.DropColumn(name: "ImageUrl", table: "Products");
            migrationBuilder.DropColumn(name: "OnlineMenuEnabled", table: "Stores");
            migrationBuilder.DropColumn(name: "OnlineOrderingEnabled", table: "Stores");
            migrationBuilder.DropColumn(name: "AllowPickup", table: "Stores");
            migrationBuilder.DropColumn(name: "AllowDelivery", table: "Stores");
            migrationBuilder.DropColumn(name: "AllowDineIn", table: "Stores");
            migrationBuilder.DropColumn(name: "AllowCashOnDelivery", table: "Stores");
            migrationBuilder.DropColumn(name: "AllowBankTransfer", table: "Stores");
            migrationBuilder.DropColumn(name: "MinOrderAmount", table: "Stores");
            migrationBuilder.DropColumn(name: "DeliveryFeeFlat", table: "Stores");
            migrationBuilder.DropColumn(name: "OnlineMenuWelcomeText", table: "Stores");
        }
    }
}
