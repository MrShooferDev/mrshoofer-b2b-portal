using System.Text.Json;
using Application.Data;
using Application.Models;
using Application.Services.Auth;
using Application.Utilities;
using Application.ViewModels.Registration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Areas.AgencyArea
{
  [Area("AgencyArea")]
  [AllowAnonymous]
  public class CreateAccountController : Controller
  {
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
      Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private readonly IOtpLogin _otpLogin;
    private readonly IMemoryCache _cache;
    private readonly AppDbContext _db;
    private readonly ILogger<CreateAccountController> _logger;

    [ActivatorUtilitiesConstructor]
    public CreateAccountController(
      IOtpLogin otpLogin,
      IMemoryCache cache,
      AppDbContext db,
      ILogger<CreateAccountController> logger)
    {
      _otpLogin = otpLogin;
      _cache = cache;
      _db = db;
      _logger = logger;
    }

    [HttpGet("CreateAccount")]
    public IActionResult Index() => View();

    private sealed class OtpCacheEntry
    {
      public string Code { get; set; } = "";
      public DateTime ExpiresAt { get; set; }
      public bool Verified { get; set; }
    }

    private static string OtpKey(string e164) => $"b2b-reg-otp:{e164}";

    [HttpPost("CreateAccount/SendOtp")]
    [IgnoreAntiforgeryToken]
    [EnableRateLimiting("ContactUsPolicy")]
    public async Task<IActionResult> SendOtp([FromBody] RegistrationOtpSendRequest? request)
    {
      var e164 = IranPhone.NormalizeToE164(request?.MobileE164 ?? request?.Mobile);
      var local09 = IranPhone.ToLocal09(e164);
      if (e164 is null || local09 is null)
      {
        return BadRequest(new { success = false, message = "شماره موبایل معتبر نیست." });
      }

      try
      {
        // Same sms.ir account as ticket and admin SMS (CustomerServiceSmsSender).
        var code = await _otpLogin.SendCode(local09);
        if (string.IsNullOrWhiteSpace(code))
        {
          _logger.LogWarning("Registration OTP returned empty code for {Mobile}", e164);
          return StatusCode(502, new { success = false, message = "ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید." });
        }

        _cache.Set(
          OtpKey(e164),
          new OtpCacheEntry
          {
            Code = code.Trim(),
            ExpiresAt = DateTime.UtcNow.AddSeconds(90),
            Verified = false
          },
          TimeSpan.FromMinutes(10));

        _logger.LogInformation("Registration OTP sent via sms.ir for {Mobile}", e164);
        return Ok(new { success = true, retryAfterSeconds = 90 });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send registration OTP for {Mobile}", e164);
        return StatusCode(502, new { success = false, message = "ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید." });
      }
    }

    [HttpPost("CreateAccount/VerifyOtp")]
    [IgnoreAntiforgeryToken]
    [EnableRateLimiting("ContactUsPolicy")]
    public IActionResult VerifyOtp([FromBody] RegistrationOtpVerifyRequest? request)
    {
      var e164 = IranPhone.NormalizeToE164(request?.MobileE164 ?? request?.Mobile);
      var code = IranPhone.ToEnglishDigits(request?.Code ?? "").Trim();
      if (e164 is null || string.IsNullOrEmpty(code))
      {
        return BadRequest(new RegistrationOtpVerifyResponse
        {
          Success = false,
          Verified = false,
          Message = "اطلاعات تأیید ناقص است."
        });
      }

      if (!_cache.TryGetValue(OtpKey(e164), out OtpCacheEntry? entry) || entry is null)
      {
        return Ok(new RegistrationOtpVerifyResponse
        {
          Success = false,
          Verified = false,
          Message = "کد منقضی شده است. دوباره ارسال کنید."
        });
      }

      if (DateTime.UtcNow > entry.ExpiresAt)
      {
        _cache.Remove(OtpKey(e164));
        return Ok(new RegistrationOtpVerifyResponse
        {
          Success = false,
          Verified = false,
          Message = "کد منقضی شده است. دوباره ارسال کنید."
        });
      }

      if (!string.Equals(entry.Code, code, StringComparison.Ordinal))
      {
        return Ok(new RegistrationOtpVerifyResponse
        {
          Success = false,
          Verified = false,
          Message = "کد وارد شده نادرست است."
        });
      }

      entry.Verified = true;
      entry.ExpiresAt = DateTime.UtcNow.AddMinutes(30);
      _cache.Set(OtpKey(e164), entry, TimeSpan.FromMinutes(35));

      // Verification stays in memory for this process. Do not hit Postgres here —
      // a unreachable DB would stall the OTP UI for several seconds.
      return Ok(new RegistrationOtpVerifyResponse { Success = true, Verified = true });
    }

    [HttpPost("CreateAccount/Submit")]
    [IgnoreAntiforgeryToken]
    [EnableRateLimiting("ContactUsPolicy")]
    public async Task<IActionResult> Submit([FromBody] RegistrationSubmitRequest? request)
    {
      if (request?.Contact is null || request.Consent is null)
      {
        return BadRequest(new { success = false, message = "اطلاعات ارسال‌شده ناقص است." });
      }

      var e164 = IranPhone.NormalizeToE164(request.Contact.MobileE164);
      if (e164 is null)
      {
        return BadRequest(new { success = false, message = "شماره موبایل معتبر نیست." });
      }

      var cacheVerified = _cache.TryGetValue(OtpKey(e164), out OtpCacheEntry? otp) && otp is { Verified: true };
      if (!cacheVerified)
      {
        return BadRequest(new { success = false, message = "شماره موبایل هنوز تأیید نشده است." });
      }

      var panel = (request.Access?.Panel ?? "").Trim().ToLowerInvariant();
      if (panel is not ("agency" or "organization"))
      {
        return BadRequest(new { success = false, message = "نوع دسترسی را انتخاب کنید." });
      }

      request.Access ??= new RegistrationAccessDto();
      request.Access.Panel = panel;
      if (request.Business is not null && panel == "organization")
        request.Business.Type = "organization";

      if (!request.Consent.TermsAccepted || !request.Consent.PrivacyAccepted)
      {
        return BadRequest(new { success = false, message = "پذیرش شرایط و حریم خصوصی الزامی است." });
      }

      var firstName = (request.Contact.FirstName ?? "").Trim();
      var lastName = (request.Contact.LastName ?? "").Trim();
      if (firstName.Length < 2 || lastName.Length < 2)
      {
        return BadRequest(new { success = false, message = "نام و نام خانوادگی را کامل وارد کنید." });
      }

      if (string.IsNullOrWhiteSpace(request.Business?.Type) || string.IsNullOrWhiteSpace(request.Identity?.LegalForm))
      {
        return BadRequest(new { success = false, message = "نوع فعالیت و فرم هویتی الزامی است." });
      }

      if (request.Preferences?.Services is null || request.Preferences.Services.Count == 0)
      {
        return BadRequest(new { success = false, message = "حداقل یک خدمت را انتخاب کنید." });
      }

      var existing = await _db.B2bRegistrationApplications
        .Where(a => a.MobileE164 == e164 && a.ApplicationStatus != "rejected")
        .OrderByDescending(a => a.CreatedAt)
        .FirstOrDefaultAsync();

      if (existing is not null && existing.ApplicationStatus is "submitted" or "needs_more_information")
      {
        return Ok(new
        {
          success = true,
          applicationId = existing.Id.ToString(),
          applicationStatus = existing.ApplicationStatus,
          panelStatus = existing.PanelStatus,
          message = "درخواست قبلی شما هنوز در حال بررسی است."
        });
      }

      // Server is source of truth for verification flag
      request.Contact.MobileE164 = e164;
      request.Contact.MobileVerified = true;

      var id = Guid.NewGuid();
      const string applicationStatus = "submitted";
      const string panelStatus = "pending_approval";

      var entity = new B2bRegistrationApplication
      {
        Id = id,
        ApplicationStatus = applicationStatus,
        PanelStatus = panelStatus,
        MobileE164 = e164,
        MobileVerified = true,
        FirstName = firstName,
        LastName = lastName,
        Email = BlankToNull(request.Contact.Email),
        Panel = panel,
        BusinessType = BlankToNull(request.Business?.Type),
        DisplayName = BlankToNull(request.Business?.DisplayName),
        WebsiteOrSocial = BlankToNull(request.Business?.WebsiteOrSocial),
        LegalForm = BlankToNull(request.Identity?.LegalForm),
        City = CityOf(request.Identity),
        ServicesJson = JsonSerializer.Serialize(request.Preferences?.Services ?? new List<string>()),
        AttributionSource = BlankToNull(request.Attribution?.Source),
        PayloadJson = JsonSerializer.Serialize(new
        {
          applicationId = id.ToString(),
          applicationStatus,
          panelStatus,
          access = request.Access,
          contact = request.Contact,
          business = request.Business,
          identity = request.Identity,
          preferences = request.Preferences,
          attribution = request.Attribution,
          consent = request.Consent,
          metadata = new
          {
            createdAt = DateTime.UtcNow,
            schemaVersion = request.Metadata?.SchemaVersion ?? "1.1.0"
          }
        }, JsonOpts),
        CreatedAt = DateTime.UtcNow
      };

      _db.B2bRegistrationApplications.Add(entity);
      await _db.SaveChangesAsync();

      _cache.Remove(OtpKey(e164));

      return Ok(new
      {
        success = true,
        applicationId = id.ToString(),
        applicationStatus,
        panelStatus,
        message = "درخواست شما ثبت شد."
      });
    }

    private static string? BlankToNull(string? value)
    {
      var trimmed = value?.Trim();
      return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static string? CityOf(RegistrationIdentityDto? identity)
    {
      if (identity is null) return null;
      return string.Equals(identity.LegalForm, "legal_entity", StringComparison.OrdinalIgnoreCase)
        ? BlankToNull(identity.CompanyCity)
        : BlankToNull(identity.ResidenceCity);
    }
  }
}
