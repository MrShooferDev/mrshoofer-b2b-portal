using System.Text;

namespace Application.Utilities
{
  public static class IranPhone
  {
    public static string ToEnglishDigits(string? input)
    {
      if (string.IsNullOrEmpty(input)) return "";
      var sb = new StringBuilder(input.Length);
      foreach (var ch in input)
      {
        sb.Append(ch switch
        {
          >= '\u06F0' and <= '\u06F9' => (char)('0' + (ch - '\u06F0')),
          >= '\u0660' and <= '\u0669' => (char)('0' + (ch - '\u0660')),
          _ => ch
        });
      }
      return sb.ToString();
    }

    /// <summary>Normalize Iranian mobile to E.164 (+98XXXXXXXXXX) or null if invalid.</summary>
    public static string? NormalizeToE164(string? input)
    {
      var digits = new string(ToEnglishDigits(input).Where(char.IsDigit).ToArray());
      if (digits.StartsWith("0098")) digits = digits[4..];
      else if (digits.StartsWith("98") && digits.Length >= 12) digits = digits[2..];
      if (digits.StartsWith("0") && digits.Length == 11) digits = digits[1..];
      if (digits.Length != 10 || digits[0] != '9') return null;
      return "+98" + digits;
    }

    /// <summary>Local 11-digit 09xxxxxxxxx form preferred by Iranian SMS gateways (sms.ir).</summary>
    public static string? ToLocal09(string? e164OrAny)
    {
      var e164 = NormalizeToE164(e164OrAny);
      if (e164 is null) return null;
      return "0" + e164[3..];
    }
  }
}
