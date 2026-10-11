using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Application.Areas.AgencyArea
{
  [Area("AgencyArea")]
  [AllowAnonymous]
  public class CreateAccountController : Controller
  {
    [HttpGet("CreateAccount")]
    public IActionResult Index()
    {
      return View();
    }
  }
}
