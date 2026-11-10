using System.Security.Cryptography;
using System.Text;

namespace Application.Services.Auth
{
  /// <summary>
  /// OTP delivery via the project's active sms.ir integration (CustomerServiceSmsSender).
  /// </summary>
  public class SmsIrOtpLogin : IOtpLogin
  {
    private readonly CustomerServiceSmsSender _sms;

    public SmsIrOtpLogin(CustomerServiceSmsSender sms)
    {
      _sms = sms;
    }

    public async Task<string> SendCode(string numberphone)
    {
      var code = GenerateOtp();
      await _sms.SendOtpCodeAsync(numberphone, code);
      return code;
    }

    public static string GenerateOtp(int length = 5)
    {
      if (length <= 0)
        throw new ArgumentOutOfRangeException(nameof(length), "Length must be a positive integer.");

      using var random = RandomNumberGenerator.Create();
      var randomBytes = new byte[length];
      random.GetBytes(randomBytes);

      var otp = new StringBuilder(length);
      for (var i = 0; i < length; i++)
        otp.Append((randomBytes[i] & 0xF) % 10);

      return otp.ToString();
    }
  }
}
