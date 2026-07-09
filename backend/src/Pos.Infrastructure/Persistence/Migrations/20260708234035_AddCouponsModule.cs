using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pos.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowBankTransfer",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowCashOnDelivery",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

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
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowPickup",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryFeeFlat",
                table: "Stores",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MinOrderAmount",
                table: "Stores",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "OnlineMenuEnabled",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OnlineMenuWelcomeText",
                table: "Stores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OnlineOrderingEnabled",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnlineVisible",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OnlineDescription",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasCoupons",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

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

            migrationBuilder.AddColumn<DateTime>(
                name: "BillRequestedAt",
                table: "Orders",
                type: "timestamp with time zone",
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

            migrationBuilder.AddColumn<Guid>(
                name: "DiningTableId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OnlinePaymentMethod",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderSource",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PublicTrackingToken",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectedReason",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledFor",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SentToKitchenAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceType",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CouponCampaigns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CampaignType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RewardTitle = table.Column<string>(type: "text", nullable: false),
                    RewardValue = table.Column<decimal>(type: "numeric", nullable: true),
                    RewardValueType = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ContactUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponCampaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CouponCampaigns_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CouponCampaigns_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DiningAreas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
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
                name: "CouponBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Prefix = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    LocationHint = table.Column<string>(type: "text", nullable: true),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponBatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CouponBatches_CouponCampaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "CouponCampaigns",
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
                    StoreId1 = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
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
                    table.ForeignKey(
                        name: "FK_DiningTables_Stores_StoreId1",
                        column: x => x.StoreId1,
                        principalTable: "Stores",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CouponCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    InternalCode = table.Column<string>(type: "text", nullable: false),
                    DisplayCode = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    MaxUses = table.Column<int>(type: "integer", nullable: false),
                    UsedCount = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CouponCodes_CouponBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "CouponBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CouponCodes_CouponCampaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "CouponCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CouponCodes_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CouponEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Consent = table.Column<bool>(type: "boolean", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CouponEntries_CouponCampaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "CouponCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CouponEntries_CouponCodes_CouponCodeId",
                        column: x => x.CouponCodeId,
                        principalTable: "CouponCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CouponEntries_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CouponLookupEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    Referrer = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponLookupEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CouponLookupEvents_CouponCodes_CouponCodeId",
                        column: x => x.CouponCodeId,
                        principalTable: "CouponCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CampaignWinners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntryId = table.Column<Guid>(type: "uuid", nullable: true),
                    AnnouncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignWinners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignWinners_CouponCampaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "CouponCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignWinners_CouponCodes_CouponCodeId",
                        column: x => x.CouponCodeId,
                        principalTable: "CouponCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignWinners_CouponEntries_EntryId",
                        column: x => x.EntryId,
                        principalTable: "CouponEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DiningTableId",
                table: "Orders",
                column: "DiningTableId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PublicTrackingToken",
                table: "Orders",
                column: "PublicTrackingToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignWinners_CampaignId",
                table: "CampaignWinners",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignWinners_CouponCodeId",
                table: "CampaignWinners",
                column: "CouponCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignWinners_EntryId",
                table: "CampaignWinners",
                column: "EntryId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponBatches_CampaignId",
                table: "CouponBatches",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponCampaigns_ProductId",
                table: "CouponCampaigns",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponCampaigns_StoreId",
                table: "CouponCampaigns",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponCodes_BatchId",
                table: "CouponCodes",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponCodes_CampaignId",
                table: "CouponCodes",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponCodes_CustomerId",
                table: "CouponCodes",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponCodes_OrganizationId_DisplayCode",
                table: "CouponCodes",
                columns: new[] { "OrganizationId", "DisplayCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CouponCodes_OrganizationId_InternalCode",
                table: "CouponCodes",
                columns: new[] { "OrganizationId", "InternalCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CouponEntries_CampaignId",
                table: "CouponEntries",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponEntries_CouponCodeId_Phone",
                table: "CouponEntries",
                columns: new[] { "CouponCodeId", "Phone" });

            migrationBuilder.CreateIndex(
                name: "IX_CouponEntries_CustomerId",
                table: "CouponEntries",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponLookupEvents_CouponCodeId",
                table: "CouponLookupEvents",
                column: "CouponCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_DiningAreas_StoreId_Name",
                table: "DiningAreas",
                columns: new[] { "StoreId", "Name" });

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
                name: "IX_DiningTables_StoreId_Code",
                table: "DiningTables",
                columns: new[] { "StoreId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_StoreId1",
                table: "DiningTables",
                column: "StoreId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_DiningTables_DiningTableId",
                table: "Orders",
                column: "DiningTableId",
                principalTable: "DiningTables",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_DiningTables_DiningTableId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "CampaignWinners");

            migrationBuilder.DropTable(
                name: "CouponLookupEvents");

            migrationBuilder.DropTable(
                name: "DiningTables");

            migrationBuilder.DropTable(
                name: "CouponEntries");

            migrationBuilder.DropTable(
                name: "DiningAreas");

            migrationBuilder.DropTable(
                name: "CouponCodes");

            migrationBuilder.DropTable(
                name: "CouponBatches");

            migrationBuilder.DropTable(
                name: "CouponCampaigns");

            migrationBuilder.DropIndex(
                name: "IX_Orders_DiningTableId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PublicTrackingToken",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AllowBankTransfer",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "AllowCashOnDelivery",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "AllowDelivery",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "AllowDineIn",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "AllowPickup",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "DeliveryFeeFlat",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "MinOrderAmount",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "OnlineMenuEnabled",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "OnlineMenuWelcomeText",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "OnlineOrderingEnabled",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsOnlineVisible",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "OnlineDescription",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "HasCoupons",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "HasOnlineMenu",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "HasOnlineOrdering",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "BillRequestedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CustomerPhone",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DeliveryAddress",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DeliveryNotes",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DiningTableId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OnlinePaymentMethod",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderSource",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PublicTrackingToken",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RejectedReason",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ScheduledFor",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SentToKitchenAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ServiceType",
                table: "Orders");
        }
    }
}
