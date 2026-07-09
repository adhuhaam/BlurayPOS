namespace Pos.Domain.Permissions;

/// <summary>Canonical permission codes — see memory-plan/SAAS_REQUIREMENTS.md</summary>
public static class PermissionDefinitions
{
    public static readonly IReadOnlyList<(string Code, string Name, string Module)> All =
    [
        ("Product.Create", "Create products", "Product"),
        ("Product.Edit", "Edit products", "Product"),
        ("Product.Delete", "Delete products", "Product"),
        ("Product.View", "View products", "Product"),
        ("Category.Manage", "Manage categories", "Category"),
        ("Inventory.View", "View inventory", "Inventory"),
        ("Inventory.Adjust", "Adjust inventory", "Inventory"),
        ("Supply.Manage", "Manage supplies", "Supply"),
        ("Sale.Create", "Create sales", "Sale"),
        ("Sale.Edit", "Edit draft orders", "Sale"),
        ("Sale.Void", "Void sales", "Sale"),
        ("Sale.Discount", "Apply discounts", "Sale"),
        ("Order.View", "View orders", "Order"),
        ("Pos.Access", "Access POS terminal", "POS"),
        ("Customer.Create", "Create customers", "Customer"),
        ("Customer.Edit", "Edit customers", "Customer"),
        ("Customer.Credit", "Manage customer credit", "Customer"),
        ("User.Create", "Create users", "User"),
        ("User.Edit", "Edit users", "User"),
        ("User.Disable", "Disable users", "User"),
        ("Report.View", "View reports", "Report"),
        ("Report.Advanced", "Advanced reports", "Report"),
        ("Expense.Create", "Create expenses", "Expense"),
        ("Expense.Approve", "Approve expenses", "Expense"),
        ("Settings.Manage", "Manage settings", "Settings"),
        ("Kitchen.View", "Kitchen display", "Kitchen"),
        ("Kitchen.Update", "Update kitchen orders", "Kitchen"),
        ("Delivery.View", "View deliveries", "Delivery"),
        ("Delivery.Update", "Update deliveries", "Delivery"),
        ("Accounting.View", "View accounting", "Accounting"),
        ("Accounting.Export", "Export accounting", "Accounting"),
        ("Purchase.Manage", "Manage purchases", "Purchase"),
        ("Promotion.View", "View coupon campaigns", "Promotion"),
        ("Promotion.Create", "Create and edit coupon campaigns", "Promotion"),
        ("Promotion.BatchGenerate", "Generate coupon QR batches", "Promotion"),
        ("Promotion.ManageWinners", "Manage campaign winners", "Promotion"),
        ("OnlineMenu.Manage", "Manage online menu", "OnlineMenu"),
        ("Tables.Manage", "Manage dining areas and tables", "Tables"),
        ("OnlineOrder.View", "View online orders", "OnlineOrdering"),
        ("OnlineOrder.Manage", "Manage online orders", "OnlineOrdering"),
        ("Hr.View", "View HR records", "HR"),
        ("Hr.Manage", "Manage employees and HR settings", "HR"),
        ("Hr.Payroll.Run", "Run payroll", "HR"),
        ("Hr.Payroll.Approve", "Approve and finalize payroll", "HR"),
        ("Hr.Attendance.Manage", "Manage attendance", "HR"),
        ("Hr.Leave.Approve", "Approve leave requests", "HR"),
        ("Platform.Manage", "Platform administration", "Platform"),
    ];

    public static readonly IReadOnlyDictionary<string, string[]> RoleMap = new Dictionary<string, string[]>
    {
        ["SuperAdmin"] = ["Platform.Manage"],
        ["OrgAdmin"] =
        [
            "Product.Create", "Product.Edit", "Product.Delete", "Product.View",
            "Category.Manage", "Inventory.View", "Inventory.Adjust", "Supply.Manage",
            "Sale.Create", "Sale.Void", "Sale.Discount",
            "Customer.Create", "Customer.Edit", "Customer.Credit",
            "User.Create", "User.Edit", "User.Disable",
            "Report.View", "Report.Advanced",
            "Expense.Create", "Expense.Approve",
            "Settings.Manage", "Kitchen.View", "Kitchen.Update",
            "Delivery.View", "Delivery.Update",
            "Accounting.View", "Accounting.Export", "Purchase.Manage",
            "OnlineMenu.Manage", "OnlineOrder.View", "OnlineOrder.Manage", "Tables.Manage",
            "Promotion.View", "Promotion.Create", "Promotion.BatchGenerate", "Promotion.ManageWinners",
            "Hr.View", "Hr.Manage", "Hr.Payroll.Run", "Hr.Payroll.Approve", "Hr.Attendance.Manage", "Hr.Leave.Approve"
        ],
        ["StoreManager"] =
        [
            "Product.View", "Category.Manage", "Inventory.View", "Inventory.Adjust", "Supply.Manage",
            "Pos.Access", "Order.View",
            "Sale.Create", "Sale.Edit", "Sale.Void", "Sale.Discount",
            "Customer.Create", "Customer.Edit",
            "Report.View", "Kitchen.View", "Kitchen.Update", "Delivery.View", "Delivery.Update",
            "OnlineMenu.Manage", "OnlineOrder.View", "OnlineOrder.Manage", "Tables.Manage",
            "Promotion.View", "Promotion.Create", "Promotion.BatchGenerate", "Promotion.ManageWinners",
            "Hr.View", "Hr.Attendance.Manage", "Hr.Leave.Approve"
        ],
        ["Cashier"] =
        [
            "Product.View", "Pos.Access", "Order.View",
            "Sale.Create", "Sale.Edit", "Sale.Discount", "Customer.Create"
        ],
        ["Waiter"] =
        [
            "Product.View", "Pos.Access", "Order.View",
            "Sale.Create", "Sale.Edit"
        ],
        ["Kitchen"] = ["Kitchen.View", "Kitchen.Update", "Product.View"],
        ["Delivery"] = ["Delivery.View", "Delivery.Update"],
        ["Accountant"] =
        [
            "Report.View", "Report.Advanced",
            "Expense.Create", "Accounting.View", "Accounting.Export", "Purchase.Manage",
            "Hr.View", "Hr.Payroll.Run"
        ]
    };

    /// <summary>Roles managers can customize per store. OrgAdmin permissions are fixed.</summary>
    public static readonly IReadOnlyList<string> ManageableRoles =
    [
        nameof(Enums.UserRole.StoreManager),
        nameof(Enums.UserRole.Cashier),
        nameof(Enums.UserRole.Waiter),
        nameof(Enums.UserRole.Kitchen),
        nameof(Enums.UserRole.Delivery),
        nameof(Enums.UserRole.Accountant),
    ];

    /// <summary>POS-facing permissions managers typically adjust.</summary>
    public static readonly IReadOnlyList<string> PosPermissionCodes =
    [
        "Pos.Access", "Order.View", "Sale.Create", "Sale.Edit", "Sale.Void", "Sale.Discount"
    ];
}
