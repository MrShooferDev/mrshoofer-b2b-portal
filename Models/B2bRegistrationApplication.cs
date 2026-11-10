namespace Application.Models
{
  public class B2bRegistrationApplication
  {
    public Guid Id { get; set; }

    public string ApplicationStatus { get; set; } = "submitted";
    public string PanelStatus { get; set; } = "pending_approval";

    public string MobileE164 { get; set; } = "";
    public bool MobileVerified { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Email { get; set; }

    /// <summary>agency or organization.</summary>
    public string? Panel { get; set; }

    public string? BusinessType { get; set; }
    public string? DisplayName { get; set; }
    public string? WebsiteOrSocial { get; set; }
    public string? LegalForm { get; set; }

    /// <summary>Company city for a legal entity, otherwise the residence city.</summary>
    public string? City { get; set; }

    /// <summary>Selected service ids as a JSON array.</summary>
    public string ServicesJson { get; set; } = "[]";

    public string? AttributionSource { get; set; }

    /// <summary>Full structured registration payload as JSON.</summary>
    public string PayloadJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
  }

  /// <summary>
  /// Proof that a mobile passed OTP for registration. The code itself is not stored.
  /// </summary>
  public class B2bRegistrationPhoneVerification
  {
    public string MobileE164 { get; set; } = "";
    public DateTime VerifiedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
  }
}
