namespace Pos.Domain.Platform;

public static class PlatformSettingsKeys
{
    public const string PlatformName = "platform.name";
    public const string PlatformTagline = "platform.tagline";
    public const string SupportEmail = "platform.support_email";
    public const string DefaultCurrency = "platform.default_currency";
    public const string DefaultTimezone = "platform.default_timezone";
    public const string AllowSelfRegistration = "platform.allow_self_registration";
    public const string MaintenanceMode = "platform.maintenance_mode";
    public const string MaintenanceMessage = "platform.maintenance_message";
    public const string BillingBankName = "billing.bank_name";
    public const string BillingBankAccount = "billing.bank_account";
    public const string BillingBankInstructions = "billing.bank_instructions";
    public const string BillingContactEmail = "billing.contact_email";

    public static readonly IReadOnlyDictionary<string, string> Defaults = new Dictionary<string, string>
    {
        [PlatformName] = "BlurayPOS",
        [PlatformTagline] = "Cloud Point of Sale for modern businesses",
        [SupportEmail] = "support@bluraypos.com",
        [DefaultCurrency] = "MVR",
        [DefaultTimezone] = "Indian/Maldives",
        [AllowSelfRegistration] = "true",
        [MaintenanceMode] = "false",
        [MaintenanceMessage] = "",
        [BillingBankName] = "",
        [BillingBankAccount] = "",
        [BillingBankInstructions] = "Transfer yearly subscription fee and upload proof in Billing.",
        [BillingContactEmail] = "billing@bluraypos.com",
    };
}
