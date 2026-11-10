using System.Text.Json.Serialization;

namespace Application.ViewModels.Registration
{
  public class RegistrationSubmitRequest
  {
    [JsonPropertyName("access")]
    public RegistrationAccessDto? Access { get; set; }

    [JsonPropertyName("contact")]
    public RegistrationContactDto? Contact { get; set; }

    [JsonPropertyName("business")]
    public RegistrationBusinessDto? Business { get; set; }

    [JsonPropertyName("identity")]
    public RegistrationIdentityDto? Identity { get; set; }

    [JsonPropertyName("preferences")]
    public RegistrationPreferencesDto? Preferences { get; set; }

    [JsonPropertyName("attribution")]
    public RegistrationAttributionDto? Attribution { get; set; }

    [JsonPropertyName("consent")]
    public RegistrationConsentDto? Consent { get; set; }

    [JsonPropertyName("metadata")]
    public RegistrationMetadataDto? Metadata { get; set; }
  }

  public class RegistrationAccessDto
  {
    [JsonPropertyName("panel")]
    public string? Panel { get; set; }
  }

  public class RegistrationContactDto
  {
    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }

    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }

    [JsonPropertyName("mobileE164")]
    public string? MobileE164 { get; set; }

    [JsonPropertyName("mobileVerified")]
    public bool MobileVerified { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }
  }

  public class RegistrationBusinessDto
  {
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("typeOther")]
    public string? TypeOther { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("websiteOrSocial")]
    public string? WebsiteOrSocial { get; set; }
  }

  public class RegistrationIdentityDto
  {
    [JsonPropertyName("legalForm")]
    public string? LegalForm { get; set; }

    [JsonPropertyName("nationalCode")]
    public string? NationalCode { get; set; }

    [JsonPropertyName("residenceCity")]
    public string? ResidenceCity { get; set; }

    [JsonPropertyName("legalName")]
    public string? LegalName { get; set; }

    [JsonPropertyName("registrationNumber")]
    public string? RegistrationNumber { get; set; }

    [JsonPropertyName("legalNationalId")]
    public string? LegalNationalId { get; set; }

    [JsonPropertyName("companyCity")]
    public string? CompanyCity { get; set; }

    [JsonPropertyName("companyAddress")]
    public string? CompanyAddress { get; set; }

    [JsonPropertyName("contactRole")]
    public string? ContactRole { get; set; }

    [JsonPropertyName("contactRoleOther")]
    public string? ContactRoleOther { get; set; }

    [JsonPropertyName("activityAreas")]
    public List<string>? ActivityAreas { get; set; }

    [JsonPropertyName("activityAreasOther")]
    public string? ActivityAreasOther { get; set; }
  }

  public class RegistrationPreferencesDto
  {
    [JsonPropertyName("services")]
    public List<string>? Services { get; set; }
  }

  public class RegistrationAttributionDto
  {
    [JsonPropertyName("source")]
    public string? Source { get; set; }

    [JsonPropertyName("sourceOther")]
    public string? SourceOther { get; set; }
  }

  public class RegistrationConsentDto
  {
    [JsonPropertyName("termsAccepted")]
    public bool TermsAccepted { get; set; }

    [JsonPropertyName("privacyAccepted")]
    public bool PrivacyAccepted { get; set; }
  }

  public class RegistrationMetadataDto
  {
    [JsonPropertyName("schemaVersion")]
    public string? SchemaVersion { get; set; }
  }
}
