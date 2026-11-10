using IPE.SmsIrClient;
using IPE.SmsIrClient.Models.Requests;

namespace Application.Services
{
  public class CustomerServiceSmsSender
  {
    private readonly SmsIr smsIr;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CustomerServiceSmsSender>? _logger;
    private long? _cachedLineNumber;

    public CustomerServiceSmsSender(IConfiguration configuration, ILogger<CustomerServiceSmsSender>? logger = null)
    {
      _configuration = configuration;
      _logger = logger;
      this.smsIr = new SmsIr(configuration["smsirapikey"] ?? string.Empty);
    }

    public async Task SendCustomerTicket_issued(string firstname, string lastname, string reference, string link, string numberphone)
    {
      VerifySendParameter[] verifySendParameters = {
           new VerifySendParameter("FIRSTNAME", firstname),
           new VerifySendParameter("LASTNAME", lastname),
           new VerifySendParameter("TRIP", link),
           new VerifySendParameter("REFERENCE", reference),
        };

      await smsIr.VerifySendAsync(numberphone, 782252, verifySendParameters);
    }

    /// <summary>
    /// Sends a one-time verification code via sms.ir.
    /// Prefers a configured verify template (<c>smsirOtpTemplateId</c>); otherwise uses bulk SMS.
    /// </summary>
    public async Task SendOtpCodeAsync(string numberphone, string code)
    {
      if (string.IsNullOrWhiteSpace(numberphone))
        throw new ArgumentException("Phone number is required.", nameof(numberphone));
      if (string.IsNullOrWhiteSpace(code))
        throw new ArgumentException("OTP code is required.", nameof(code));

      var phone = numberphone.Trim();
      var otp = code.Trim();

      var templateRaw = _configuration["smsirOtpTemplateId"];
      if (!string.IsNullOrWhiteSpace(templateRaw) && int.TryParse(templateRaw, out var templateId) && templateId > 0)
      {
        var paramName = string.IsNullOrWhiteSpace(_configuration["smsirOtpParameterName"])
          ? "CODE"
          : _configuration["smsirOtpParameterName"]!.Trim();

        var response = await smsIr.VerifySendAsync(
          phone,
          templateId,
          new[] { new VerifySendParameter(paramName, otp) });

        if (response?.Status != 1)
        {
          throw new InvalidOperationException(
            $"sms.ir OTP verify-send failed. Status={response?.Status}, Message={response?.Message}");
        }

        return;
      }

      var text = $"کد تأیید مسترشوفر: {otp}\nاین کد تا ۹۰ ثانیه معتبر است.";
      var lineNumber = await ResolveLineNumberAsync();
      var bulk = await smsIr.BulkSendAsync(lineNumber, text, new[] { phone });

      if (bulk?.Status != 1)
      {
        throw new InvalidOperationException(
          $"sms.ir OTP bulk-send failed. Status={bulk?.Status}, Message={bulk?.Message}");
      }
    }

    /// <summary>
    /// Notifies the admin phone that a new contact-us message landed in Admin / پیام‌ها.
    /// </summary>
    public async Task NotifyAdminNewContactMessageAsync(string? name, string number, string message)
    {
      var adminPhone = _configuration["AdminNotifyPhone"];
      if (string.IsNullOrWhiteSpace(adminPhone))
      {
        _logger?.LogWarning("AdminNotifyPhone is not configured; skipping contact-message SMS.");
        return;
      }

      var displayName = string.IsNullOrWhiteSpace(name) ? "بدون نام" : name.Trim();
      var preview = Truncate(message?.Trim() ?? string.Empty, 80);
      var text =
        $"پیام جدید در پیام‌ها\nنام: {displayName}\nشماره: {number}\nمتن: {preview}";

      var lineNumber = await ResolveLineNumberAsync();
      var response = await smsIr.BulkSendAsync(lineNumber, text, new[] { adminPhone });

      if (response?.Status != 1)
      {
        throw new InvalidOperationException(
          $"sms.ir admin notify failed. Status={response?.Status}, Message={response?.Message}");
      }
    }

    private async Task<long> ResolveLineNumberAsync()
    {
      if (_cachedLineNumber.HasValue)
        return _cachedLineNumber.Value;

      var configured = _configuration["smsirlinenumber"];
      if (!string.IsNullOrWhiteSpace(configured) && long.TryParse(configured, out var line))
      {
        _cachedLineNumber = line;
        return line;
      }

      var lines = await smsIr.GetLinesAsync();
      if (lines?.Data == null || lines.Data.Length == 0)
        throw new InvalidOperationException("sms.ir returned no sender lines.");

      _cachedLineNumber = lines.Data[0];
      return _cachedLineNumber.Value;
    }

    private static string Truncate(string value, int maxChars)
    {
      if (string.IsNullOrEmpty(value) || value.Length <= maxChars)
        return value;
      return value[..maxChars] + "…";
    }
  }
}
