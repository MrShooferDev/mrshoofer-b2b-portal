using Application.Utilities;
using Xunit;

namespace Application.Tests;

public class IranPhoneAndRegistrationTests
{
  [Theory]
  [InlineData("09121234567", "+989121234567")]
  [InlineData("۹۱۲۱۲۳۴۵۶۷", "+989121234567")]
  [InlineData("+989121234567", "+989121234567")]
  [InlineData("989121234567", "+989121234567")]
  [InlineData("02112345678", null)]
  [InlineData("", null)]
  public void NormalizeToE164_handles_common_inputs(string input, string? expected)
  {
    Assert.Equal(expected, IranPhone.NormalizeToE164(input));
  }

  [Fact]
  public void ToLocal09_from_e164()
  {
    Assert.Equal("09121234567", IranPhone.ToLocal09("+989121234567"));
  }
}
