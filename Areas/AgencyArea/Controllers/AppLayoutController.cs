using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Application.Areas.AgencyArea
{
  [Area("AgencyArea")]
  [AllowAnonymous]
  public class AppLayoutController : Controller
  {
    [HttpGet("AppLayout")]
    public IActionResult Index()
    {
      return View();
    }
  }
}
