using System.Text.Json.Serialization;

namespace Application.ViewModels.Registration
{
  public class RegistrationOtpSendRequest
  {
    [JsonPropertyName("mobile")]
    public string? Mobile { get; set; }

    [JsonPropertyName("mobileE164")]
    public string? MobileE164 { get; set; }
  }

  public class RegistrationOtpVerifyRequest
  {
    [JsonPropertyName("mobile")]
    public string? Mobile { get; set; }

    [JsonPropertyName("mobileE164")]
    public string? MobileE164 { get; set; }

    [JsonPropertyName("code")]
    public string? Code { get; set; }
  }

  public class RegistrationOtpVerifyResponse
  {
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("verified")]
    public bool Verified { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }
  }
}
